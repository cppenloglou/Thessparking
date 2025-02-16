package gr.tiropita.thessparking_api.config;

import gr.tiropita.thessparking_api.token.TokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TokenRepository tokenRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        try {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    String username = jwtService.extractUsername(token);
                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        boolean isTokenValid = tokenRepository.findByToken(token)
                                .map(t -> !t.isExpired() && !t.isRevoked())
                                .orElse(false);
                        if (jwtService.isTokenValid(token, userDetails) && isTokenValid) {
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            SecurityContextHolder.getContext().setAuthentication(auth);
                            accessor.setUser(auth);
                        } else {
                            throw new SecurityException("Invalid WebSocket Token");
                        }
                    }
                } else {
                    throw new SecurityException("Missing Bearer Token");
                }
            }
            return message;
        } catch (Exception e) {
            System.err.println("WebSocket authentication error: " + e.getMessage());
            throw new SecurityException("WebSocket Authentication Failed", e);
        }
    }
}

