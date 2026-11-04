
package com.seevix.backend.controller;

import com.seevix.backend.entity.Complaint;
import com.seevix.backend.repository.ComplaintRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;

    public ComplaintController(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    // Create a complaint
    @PostMapping
    public Complaint createComplaint(@RequestBody Complaint complaint) {
        return complaintRepository.save(complaint);
    }

    // Get all complaints
    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    // Get complaint by ID
    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable Long id) {
        return complaintRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update complaint status
    @PatchMapping("/{id}/status")
    public ResponseEntity<Complaint> updateComplaintStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String newStatus = request.get("status");

        List<String> allowedStatuses = List.of(
                "Submitted",
                "Under Review",
                "In Progress",
                "Resolved"
        );

        if (newStatus == null || !allowedStatuses.contains(newStatus)) {
            return ResponseEntity.badRequest().build();
        }

        return complaintRepository.findById(id)
                .map(complaint -> {
                    complaint.setStatus(newStatus);
                    return ResponseEntity.ok(
                            complaintRepository.save(complaint)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
