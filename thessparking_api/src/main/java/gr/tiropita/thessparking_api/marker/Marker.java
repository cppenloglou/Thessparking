package gr.tiropita.thessparking_api.marker;

import gr.tiropita.thessparking_api.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "marker")
public class Marker {
    @Id
    @GeneratedValue
    private Integer id;
    private Double latitude;
    private Double longitude;
    @Enumerated(EnumType.STRING)
    private MarkerStatus status;
    private Integer notAvailableCount;
    private Integer notValidCount;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
