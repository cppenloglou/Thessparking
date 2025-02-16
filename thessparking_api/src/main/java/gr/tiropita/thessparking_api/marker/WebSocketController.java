package gr.tiropita.thessparking_api.marker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class WebSocketController {

    private final MarkerService markerService;

    @MessageMapping("/markers")
    @SendTo("/topic/nearby-markers")
    public List<MarkerDTO> getNearbyMarkers(@Payload LocationRequest request) {
        log.info("Fetching nearby markers for lat: {}, lon: {}", request.getLatitude(), request.getLongitude());
        List<MarkerDTO> markers =  markerService.getNearbyMarkers(request.getLatitude(), request.getLongitude());
        log.info("Found {} nearby markers.", markers.size());
        return markers;
    }
}
