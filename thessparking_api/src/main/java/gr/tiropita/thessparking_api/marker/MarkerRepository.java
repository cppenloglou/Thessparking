package gr.tiropita.thessparking_api.marker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MarkerRepository extends JpaRepository<Marker, Integer> {
    @Query("SELECT m FROM Marker m " +
            "WHERE (6371 * ACOS(" +
            "COS(RADIANS(:latitude)) * COS(RADIANS(m.latitude)) * " +
            "COS(RADIANS(m.longitude) - RADIANS(:longitude)) + " +
            "SIN(RADIANS(:latitude)) * SIN(RADIANS(m.latitude))" +
            ")) <= 3")
    List<Marker> findMarkersWithin3Km(@Param("latitude") double latitude,
                                      @Param("longitude") double longitude);
    Marker findMarkerByLatitudeAndLongitude(double latitude, double longitude);
}
