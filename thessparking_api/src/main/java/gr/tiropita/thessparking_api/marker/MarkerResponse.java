package gr.tiropita.thessparking_api.marker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MarkerResponse {
    private MarkerDTO marker;
    private String comments;
}
