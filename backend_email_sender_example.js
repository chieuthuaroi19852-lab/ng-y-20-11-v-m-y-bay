<?php
// guimail.php - Phiên bản hỗ trợ cập nhật trạng thái Đã thanh toán / Hủy
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ==== CẤU HÌNH ====
define('SMTP_HOST', 'smtp.bizflycloud.vn');
define('SMTP_PORT', 587);
define('SMTP_USER', 'nha.uyen@vemaybaynhauyen.com');
define('SMTP_PASS', 'AnhYeuEm@123');
define('ADMIN_EMAIL', 'nha.uyen@vemaybaynhauyen.com');
define('SENDER_NAME', 'Vemaybaynhauyen.com');
define('MAIL_LOG_FILE', __DIR__ . '/mail_error.log');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit(); }

function mail_log($level, $message, $context = []) {
    $line = sprintf("[%s] %s: %s %s\n", date('Y-m-d H:i:s'), strtoupper($level), $message, json_encode($context, JSON_UNESCAPED_UNICODE));
    @file_put_contents(MAIL_LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}

function arr_get($arr, $path, $default = null) {
    if (!is_array($arr)) return $default;
    $keys = explode('.', $path);
    $cur = $arr;
    foreach ($keys as $k) {
        if (is_array($cur) && array_key_exists($k, $cur)) $cur = $cur[$k];
        else return $default;
    }
    return $cur;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

if (!is_array($payload) || !isset($payload['contact'])) {
    echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ']);
    exit();
}

try {
    // Gửi cho khách và admin
    sendCustomerConfirmation($payload);
    
    // Chỉ gửi admin notification nếu đây là booking mới (pending) hoặc trạng thái thay đổi quan trọng
    // Ở đây gửi luôn để admin lưu vết
    sendAdminNotification($payload);

    echo json_encode(['success' => true, 'message' => 'Email đã được gửi.']);
} catch (Exception $e) {
    mail_log('error', $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi gửi mail: ' . $e->getMessage()]);
}

// --- HELPER FUNCTIONS ---

function formatCurrency($amount) {
    return number_format((float)$amount, 0, ',', '.') . ' VND';
}

function formatDateTime($dateString, $format = 'H:i d/m/Y') {
    try { return (new DateTime($dateString))->format($format); } catch(Exception $e) { return 'N/A'; }
}

function getPaymentDeadlinePHP($departureTimeStr, $bookingTimeStr) {
    try {
        $bookingTime = new DateTime($bookingTimeStr ?? 'now');
        $departureTime = new DateTime($departureTimeStr ?? $bookingTime->format('Y-m-d H:i:s'));
        $interval = $bookingTime->diff($departureTime);
        $hours = ($interval->days * 24) + $interval->h;
        
        $deadline = clone $bookingTime;
        if ($hours > 72) $deadline->add(new DateInterval('PT12H'));
        elseif ($hours > 24) $deadline->add(new DateInterval('PT4H'));
        else $deadline->add(new DateInterval('PT1H'));
        
        $limit = clone $departureTime;
        $limit->sub(new DateInterval('PT4H'));
        
        if ($deadline > $limit) $deadline = $limit;

        return 'trước ' . $deadline->format('H:i \n\gà\y d/m/Y');
    } catch(Exception $e) { return "trong vòng 4 giờ tới"; }
}

function safe_html($s) {
    return htmlspecialchars((string)$s);
}

function translateTitle($title) {
    switch ($title) {
        case 'Mr': return 'Ông';
        case 'Mrs': return 'Bà';
        case 'Miss': return 'Cô';
        case 'Master': return 'Bé';
        default: return '';
    }
}

function generateETicketHTML($payload) {
    $bookingData = $payload;
    $status = isset($bookingData['status']) ? $bookingData['status'] : 'pending';
    
    // Xử lý hiển thị trạng thái
    $statusDisplay = '';
    $statusNote = '';
    
    if ($status === 'paid') {
        $statusDisplay = '<strong style="color: #28a745; font-size: 16px; border: 2px solid #28a745; padding: 4px 8px; border-radius: 4px;">ĐÃ THANH TOÁN / XUẤT VÉ</strong>';
        $statusNote = '<p style="color: #28a745;"><strong>Đã hoàn tất:</strong> Vé điện tử này có giá trị để làm thủ tục bay.</p>';
    } elseif ($status === 'cancelled') {
        $statusDisplay = '<strong style="color: #dc3545; font-size: 16px; border: 2px solid #dc3545; padding: 4px 8px; border-radius: 4px;">ĐÃ HỦY</strong>';
        $statusNote = '<p style="color: #dc3545;"><strong>Lưu ý:</strong> Đơn hàng này đã bị hủy và vé không còn giá trị.</p>';
    } else {
        $statusDisplay = '<strong style="color: #fd7e14; font-size: 16px; border: 2px solid #fd7e14; padding: 4px 8px; border-radius: 4px;">CHƯA THANH TOÁN</strong>';
        $depTime = arr_get($bookingData, 'bookingDetails.selected_flights.0.flights.0.departure_airport.time', '');
        $bookTime = arr_get($bookingData, 'bookingTimestamp', '');
        $deadline = getPaymentDeadlinePHP($depTime, $bookTime);
        $statusNote = '<p style="color: #d9534f;"><strong>Thanh toán:</strong> Vui lòng thanh toán ' . $deadline . ' để xuất vé.</p>';
    }

    $pnr = safe_html(arr_get($bookingData, 'pnr', 'N/A'));
    $orderId = safe_html(arr_get($bookingData, 'id', 'N/A'));
    $flights = arr_get($bookingData, 'bookingDetails.selected_flights', []);
    
    // Build HTML
    $html = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; background-color: #fff;">';
    
    // Header
    $html .= '<div style="border-bottom: 2px solid #DA251D; padding-bottom: 10px; margin-bottom: 20px;">
        <span style="font-size: 24px; font-weight: bold; color: #0056b3;">Nhã Uyên</span>
        <span style="font-size: 24px; font-weight: bold; color: #DA251D;"> AIR</span>
        <div style="float: right; text-align: right;">
            <div style="font-size: 12px; color: #666;">Mã đơn hàng</div>
            <div style="font-size: 18px; font-weight: bold;">' . $orderId . '</div>
        </div>
        <div style="clear: both;"></div>
    </div>';

    // Title & Status
    $html .= '<div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #DA251D; margin: 0 0 10px 0;">VÉ ĐIỆN TỬ</h1>
        <div style="font-size: 14px; color: #555; margin-bottom: 15px;">Mã đặt chỗ (PNR): <span style="font-size: 24px; font-weight: bold; color: #333;">' . $pnr . '</span></div>
        <div>' . $statusDisplay . '</div>
    </div>';

    // Passenger Info
    $html .= '<div style="margin-bottom: 25px;">
        <h3 style="background: #eee; padding: 8px; border-left: 4px solid #0056b3; margin-top: 0;">1. Thông tin hành khách</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f9f9f9;"><th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Họ và Tên</th><th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Loại vé</th></tr>';
    foreach (arr_get($bookingData, 'passengers', []) as $p) {
        $html .= '<tr>
            <td style="padding: 8px; border: 1px solid #ddd;">' . translateTitle($p['title']) . '. ' . strtoupper(safe_html($p['fullName'])) . '</td>
            <td style="padding: 8px; border: 1px solid #ddd;">' . safe_html($p['type']) . '</td>
        </tr>';
    }
    $html .= '</table></div>';

    // Flight Info
    $html .= '<div style="margin-bottom: 25px;">
        <h3 style="background: #eee; padding: 8px; border-left: 4px solid #0056b3; margin-top: 0;">2. Chi tiết chuyến bay</h3>';
    foreach ($flights as $leg) {
        $html .= '<div style="margin-bottom: 15px; border: 1px solid #eee; padding: 10px;">';
        $html .= '<div style="font-weight: bold; color: #DA251D; margin-bottom: 5px;">' . safe_html($leg['type']) . '</div>';
        foreach ($leg['flights'] as $f) {
            $dep = $f['departure_airport'];
            $arr = $f['arrival_airport'];
            $html .= '<table style="width: 100%;"><tr>
                <td style="width: 60px;"><img src="' . safe_html($f['airline_logo']) . '" style="width: 40px;"></td>
                <td>
                    <strong>' . safe_html($f['airline']) . ' (' . safe_html($f['flight_number']) . ')</strong><br/>
                    ' . formatDateTime($dep['time']) . ' <strong>' . safe_html($dep['id']) . '</strong> <br/>
                    ' . formatDateTime($arr['time']) . ' <strong>' . safe_html($arr['id']) . '</strong>
                </td>
            </tr></table>';
        }
        $html .= '</div>';
    }
    $html .= '</div>';

    // Notes
    $html .= '<div style="margin-bottom: 20px;">
        <h3 style="background: #eee; padding: 8px; border-left: 4px solid #0056b3; margin-top: 0;">3. Lưu ý</h3>
        <div style="font-size: 13px; line-height: 1.6;">
            ' . $statusNote . '
            <p>Quý khách vui lòng có mặt tại sân bay trước giờ khởi hành ít nhất 90 phút (Nội địa) hoặc 180 phút (Quốc tế).</p>
            <p>Mọi thắc mắc xin liên hệ hotline: <strong style="color: #DA251D;">0961000240</strong></p>
        </div>
    </div>';

    $html .= '</div>';
    return $html;
}

function createMailer() {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;
    $mail->setFrom(SMTP_USER, SENDER_NAME);
    $mail->CharSet = 'UTF-8';
    return $mail;
}

function sendCustomerConfirmation($payload) {
    $email = arr_get($payload, 'contact.email');
    if (!$email) return;
    
    $status = isset($payload['status']) ? $payload['status'] : 'pending';
    $subjectPrefix = 'Xác nhận đặt vé';
    if ($status === 'paid') $subjectPrefix = 'Vé điện tử & Xác nhận thanh toán';
    if ($status === 'cancelled') $subjectPrefix = 'Thông báo Hủy vé';

    $mail = createMailer();
    $mail->addAddress($email);
    $mail->Subject = '[' . $subjectPrefix . '] Mã đơn: ' . arr_get($payload, 'id') . ' - PNR: ' . arr_get($payload, 'pnr');
    $mail->isHTML(true);
    $mail->Body = generateETicketHTML($payload);
    $mail->send();
}

function sendAdminNotification($payload) {
    $mail = createMailer();
    $mail->addAddress(ADMIN_EMAIL);
    $status = isset($payload['status']) ? $payload['status'] : 'pending';
    $mail->Subject = '[ADMIN - ' . strtoupper($status) . '] Booking: ' . arr_get($payload, 'pnr');
    $mail->isHTML(true);
    $mail->Body = generateETicketHTML($payload);
    $mail->send();
}
?>