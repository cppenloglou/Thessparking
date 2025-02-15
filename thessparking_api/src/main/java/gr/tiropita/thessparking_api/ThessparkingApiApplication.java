package gr.tiropita.thessparking_api;

import gr.tiropita.thessparking_api.auth.AuthenticationService;
import gr.tiropita.thessparking_api.auth.RegisterRequest;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import static gr.tiropita.thessparking_api.user.Role.ADMIN;
import static gr.tiropita.thessparking_api.user.Role.MANAGER;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class ThessparkingApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ThessparkingApiApplication.class, args);
    }

    @Bean
    public CommandLineRunner commandLineRunner(
            AuthenticationService service
    ) {
        return args -> {
            var admin = RegisterRequest.builder()
                    .name("Admin")
                    .email("admin@mail.com")
                    .password("password")
                    .role(ADMIN)
                    .build();
            System.out.println("Admin token: " + service.register(admin).getAccessToken());

            var manager = RegisterRequest.builder()
                    .name("Manager")
                    .email("manager@mail.com")
                    .password("password")
                    .role(MANAGER)
                    .build();
            System.out.println("Manager token: " + service.register(manager).getAccessToken());

        };
    }

}
