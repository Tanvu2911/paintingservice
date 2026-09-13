# ==========================================
# Stage 1: Build JAR with Maven
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build application
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Runtime Image with JRE 21 Alpine
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user and setup directories
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

USER appuser

# Copy JAR from builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
