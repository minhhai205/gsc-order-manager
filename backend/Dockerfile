# ========================================================
# STAGE 1: BUILD JAR FILE
# ========================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy pom.xml to download dependencies (improves build caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN mvn package -DskipTests

# ========================================================
# STAGE 2: RUNTIME
# ========================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy built jar from stage 1
COPY --from=builder /app/target/*.jar app.jar

# Expose backend port
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
