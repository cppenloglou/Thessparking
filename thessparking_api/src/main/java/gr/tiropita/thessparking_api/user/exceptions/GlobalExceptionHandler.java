package gr.tiropita.thessparking_api.user.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailNotFoundException.class)
    public ResponseEntity<String> handleEmailNotFound(EmailNotFoundException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IncorrectPasswordException.class)
    public ResponseEntity<String> handleIncorrectPassword(IncorrectPasswordException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<String> handleGenericException(EmailAlreadyExistsException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
