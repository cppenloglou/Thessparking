package gr.tiropita.thessparking_api.user.exceptions;

public class EmailNotFoundException extends RuntimeException {
    public EmailNotFoundException(String message) {
        super(message);
    }
}

