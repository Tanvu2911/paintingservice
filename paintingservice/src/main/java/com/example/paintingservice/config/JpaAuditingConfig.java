package com.example.paintingservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Kích hoạt JPA Auditing để tự động quản lý @CreatedDate và @LastModifiedDate
 * trên các Entity kế thừa BaseEntity.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
