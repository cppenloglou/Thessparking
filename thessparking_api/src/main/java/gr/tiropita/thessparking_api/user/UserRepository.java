package gr.tiropita.thessparking_api.user;

import gr.tiropita.thessparking_api.token.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
  @Query("SELECT u FROM User u JOIN u.tokens t WHERE t.token = :token AND (t.expired = false OR t.revoked = false)")
  User findByValidToken(@Param("token") String token);

}
