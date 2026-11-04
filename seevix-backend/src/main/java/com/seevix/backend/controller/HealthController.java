package com.seevix.backend.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("application", "SEEVIX Backend", "status", "UP",
                      "message", "SEEVIX API is running");
    }
}
