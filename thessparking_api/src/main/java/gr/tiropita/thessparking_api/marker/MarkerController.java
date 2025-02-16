package gr.tiropita.thessparking_api.marker;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/markers")
@RequiredArgsConstructor
public class MarkerController {

    private final MarkerService markerService;

    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/create")
    public ResponseEntity<?> createMarker(
            @RequestBody MarkerRequestDTO request,
     @RequestHeader("Authorization") String authorizationHeader) {

        MarkerResponse result = getMarkerResponse(request, authorizationHeader);
        if(result.getComments().equals("Marker could not be created"))
            return ResponseEntity.badRequest().body(result.getComments());
        // Broadcast to all clients
        messagingTemplate.convertAndSend("/topic/markers", result.getMarker());
        return ResponseEntity.ok(result.getMarker());
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claimMarker(
            @RequestBody MarkerRequestDTO request,
            @RequestHeader("Authorization") String authorizationHeader) {
        // Extract the token from the header
        MarkerResponse result = getMarkerResponse(request, authorizationHeader);
        if(result.getComments().equals("Marker could not be deleted"))
            return ResponseEntity.badRequest().body(result.getComments());
        // Broadcast to all clients
        messagingTemplate.convertAndSend("/topic/markers", result.getMarker());
        return ResponseEntity.ok(result.getMarker());
    }

    @PostMapping("/report")
    public ResponseEntity<?> reportMarker(@RequestBody ReportRequest request) {
        MarkerResponse result = markerService.reportMarker(request);
        if(result.getComments().equals("Marker could not be updated"))
            return ResponseEntity.badRequest().body(result.getComments());
        // Broadcast to all clients
        messagingTemplate.convertAndSend("/topic/markers", result.getMarker());
        return ResponseEntity.ok(result.getMarker());
    }

    private MarkerResponse getMarkerResponse(MarkerRequestDTO request, String authorizationHeader) {
        // Extract the token from the header
        String token = authorizationHeader.replace("Bearer ", "");
        MarkerRequest markerRequest = MarkerRequest.builder()
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .token(token).build();
        return markerService.createMarker(markerRequest);
    }
}
