package gr.tiropita.thessparking_api.marker;

import gr.tiropita.thessparking_api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.web.mappings.MappingsEndpoint;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarkerService {
    private final MarkerRepository markerRepository;
    private final UserRepository userRepository;
    private final MappingsEndpoint mappingsEndpoint;

    public MarkerResponse createMarker(MarkerRequest markerRequest) {
        try {
            var createdByUser = userRepository.findByValidToken(markerRequest.getToken());

            var marker = Marker.builder()
                    .longitude(markerRequest.getLongitude())
                    .latitude(markerRequest.getLatitude())
                    .status(MarkerStatus.AVAILABLE)
                    .user(createdByUser)
                    .notAvailableCount(0)
                    .notValidCount(0).build();

            var saved_marker = markerRepository.save(marker);
            return getMarkerResponse(saved_marker, "Successfully created", "CREATE");
        } catch (Exception ex) {
            return MarkerResponse.builder()
                    .marker(MarkerDTO.builder().build())
                    .comments("Marker could not be created")
                    .build();
        }
    }

    public MarkerResponse claimMarker(MarkerRequest markerRequest) {
        try {
            var claimedByUser = userRepository.findByValidToken(markerRequest.getToken());

            var marker = markerRepository
                    .findMarkerByLatitudeAndLongitude(markerRequest.getLatitude(), markerRequest.getLongitude());

            var createdByUser = marker.getUser();

            createdByUser.setValidSpotPoints(100);
            claimedByUser.setValidClaimPoints(25);

            userRepository.save(createdByUser);
            userRepository.save(claimedByUser);
            markerRepository.delete(marker);

            return getMarkerResponse(marker, "Successfully deleted", "DELETE");
        } catch (Exception ex) {
            return MarkerResponse.builder()
                    .marker(MarkerDTO.builder().build())
                    .comments("Marker could not be deleted")
                    .build();
        }
    }

    public MarkerResponse reportMarker(ReportRequest reportRequest) {
        try {

            var marker = markerRepository
                    .findMarkerByLatitudeAndLongitude(reportRequest.getLatitude(), reportRequest.getLongitude());


            var createdByUser = marker.getUser();
            int valid_points = createdByUser.getValidSpotPoints();
            if(valid_points >= 200) {
                createdByUser.setValidSpotPoints(valid_points-200);
            } else {
                createdByUser.setValidSpotPoints(0);
            }

            userRepository.save(createdByUser);

            if(reportRequest.getReportType().equals("NOT_VALID")) {
                int not_valid_count = marker.getNotValidCount();

                if(not_valid_count+1 == 10) {
                    marker.setNotValidCount(10);
                    marker.setStatus(MarkerStatus.MAYBE_NOT_VALID);
                } else if(not_valid_count+1 == 15) {
                    marker.setNotValidCount(15);
                    markerRepository.delete(marker);
                    return getMarkerResponse(marker, "Successfully deleted", "DELETE");
                } else {
                    marker.setNotValidCount(not_valid_count+1);
                }
            } else if(reportRequest.getReportType().equals("NOT_AVAILABLE")) {
                int not_available_count = marker.getNotAvailableCount();

                if(not_available_count+1 == 10) {
                    marker.setNotAvailableCount(10);
                    marker.setStatus(MarkerStatus.MAYBE_UNAVAILABLE);
                } else if(not_available_count+1 == 15) {
                    marker.setNotAvailableCount(15);
                    markerRepository.delete(marker);
                    return getMarkerResponse(marker, "Successfully deleted", "DELETE");
                } else {
                    marker.setNotAvailableCount(not_available_count+1);
                }
            }

            markerRepository.save(marker);

            return getMarkerResponse(marker, "Successfully updated", "UPDATE");
        } catch (Exception ex) {
            return MarkerResponse.builder()
                    .marker(MarkerDTO.builder().build())
                    .comments("Marker could not be updated")
                    .build();
        }
    }

    public List<MarkerDTO> getNearbyMarkers(double latitude, double longitude) {
        try {
            List<Marker> nearbyMarkers = markerRepository.findMarkersWithin3Km(latitude, longitude);

            return nearbyMarkers.stream()
                    .map(marker -> MarkerDTO.builder()
                            .longitude(marker.getLongitude())
                            .latitude(marker.getLatitude())
                            .status(marker.getStatus().name())
                            .action("NEARBY")
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    private static MarkerResponse getMarkerResponse(Marker marker, String comments, String action) {
        var marker_dto = MarkerDTO.builder()
                .longitude(marker.getLongitude())
                .latitude(marker.getLatitude())
                .status(marker.getStatus().name())
                .action(action)
                .build();
        return MarkerResponse.builder()
                .marker(marker_dto)
                .comments(comments)
                .build();
    }


}
