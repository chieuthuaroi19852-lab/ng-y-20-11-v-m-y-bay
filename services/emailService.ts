import { BookingData } from '../types';
import { EMAIL_API_URL } from './apiConfig';

/**
 * Sends a confirmation email to the customer and a notification to the admin.
 * @param bookingData The complete data of the confirmed booking.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export const sendConfirmationEmail = async (bookingData: BookingData): Promise<{ success: boolean, message: string }> => {
    try {
        // The guimail.php script handles the email sending logic.
        // Direct call without proxy, as the PHP script should have CORS headers.
        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Email server error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to send confirmation email:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message: `Could not send email: ${message}` };
    }
};