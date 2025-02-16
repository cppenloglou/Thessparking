package gr.tiropita.thessparking_api.marker;

import gr.tiropita.thessparking_api.token.Token;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MarkerRequest {
    private Double latitude;
    private Double longitude;
    private String token;
}
