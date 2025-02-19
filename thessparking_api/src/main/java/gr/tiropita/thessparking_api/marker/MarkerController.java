package gr.tiropita.thessparking_api.marker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/markers")
@RequiredArgsConstructor
@Slf4j
public class MarkerController {

    private final MarkerService markerService;

    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/create")
    public ResponseEntity<?> createMarker(
            @RequestBody MarkerRequestDTO request,
            @RequestHeader("Authorization") String authorizationHeader) {
        MarkerRequest markerRequest = getMarkerResponse(request, authorizationHeader);
        MarkerResponse result = markerService.createMarker(markerRequest);
        if (result.getComments().equals("Marker could not be created"))
            return ResponseEntity.badRequest().body(result.getComments());
        messagingTemplate.convertAndSend("/topic/markers", result.getMarker());
        return ResponseEntity.ok(result.getMarker());
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claimMarker(
            @RequestBody MarkerRequestDTO request,
            @RequestHeader("Authorization") String authorizationHeader) {
        MarkerRequest markerRequest = getMarkerResponse(request, authorizationHeader);
        MarkerResponse result = markerService.claimMarker(markerRequest);
        if (result.getComments().equals("Marker could not be deleted"))
            return ResponseEntity.badRequest().body(result.getComments());
        messagingTemplate.convertAndSend("/topic/markers", result.getMarker());
        return ResponseEntity.ok(result.getMarker());
    }

    @PostMapping("/report")
    public ResponseEntity<?> reportMarker(@RequestBody ReportRequest request) {
        MarkerResponse result = markerService.reportMarker(request);
        if (result.getComments().equals("Marker could not be updated"))
            return ResponseEntity.badRequest().body(result.getComments());
        messagingTemplate.convertAndSend("/topic/markers", result.getMarker());
        return ResponseEntity.ok(result.getMarker());
    }

    private MarkerRequest getMarkerResponse(
            MarkerRequestDTO request,
            String authorizationHeader) {
        String token = authorizationHeader.replace("Bearer ", "");
        return MarkerRequest.builder()
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .token(token).build();
    }

    @PostMapping("/getMarkers")
    public List<MarkerDTO> getNearbyMarkers(@RequestBody LocationRequest request) {
        log.info("Fetching nearby markers for lat: {}, lon: {}", request.getLatitude(), request.getLongitude());
        List<MarkerDTO> markers = markerService.getNearbyMarkers(request.getLatitude(), request.getLongitude());
        log.info("Found {} nearby markers.", markers.size());
        return markers;
    }
}
