package gr.tiropita.thessparking_api.auth;

import gr.tiropita.thessparking_api.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
  private String name;
  private String email;
  private String password;
  private Role role;
}
