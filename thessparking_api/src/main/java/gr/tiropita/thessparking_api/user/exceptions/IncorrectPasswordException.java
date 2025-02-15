package gr.tiropita.thessparking_api.user.exceptions;

public class IncorrectPasswordException extends RuntimeException {
    public IncorrectPasswordException(String message) {
        super(message);
    }
}

