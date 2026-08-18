package com.example.paintingservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.paintingservice.enums.*;

/**
 * Entity StaffProfile lưu hồ sơ thợ sơn.
 * Chứa thông tin cá nhân và trạng thái làm việc của thợ.
 */
@Entity
@Table(name = "staff_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String specialty;
    private Integer experienceYears;
    private Double rating;
    private Boolean available;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffType staffType;

    @Column(name = "service_area", columnDefinition = "TEXT")
    private String serviceArea; // Khu vực hoạt động (các quận/huyện tại Hà Nội)

    @Column(name = "bank_name", length = 100)
    private String bankName; // Tên ngân hàng (VD: MB Bank, Vietcombank, Techcombank)

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber; // Số tài khoản ngân hàng

    @Column(name = "bank_account_name", length = 100)
    private String bankAccountName; // Tên chủ tài khoản
}
