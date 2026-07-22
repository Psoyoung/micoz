# =====================================================================
# MICOZ Backend - Multi-stage Dockerfile
# Stage 1: Build (Gradle)
# Stage 2: Runtime (JRE only)
# =====================================================================

FROM gradle:8.8-jdk17-alpine AS builder
WORKDIR /workspace

COPY settings.gradle build.gradle ./
COPY gradle ./gradle
COPY src ./src

RUN gradle clean bootJar -x test --no-daemon


FROM eclipse-temurin:17-jre-alpine AS runtime

RUN addgroup -S micoz && adduser -S micoz -G micoz
WORKDIR /app

COPY --from=builder /workspace/build/libs/*.jar app.jar
RUN chown -R micoz:micoz /app

USER micoz

EXPOSE 8080

# 무료 512MB 대비 여유 확보(OOM 킬=원인불명 재시작 방지). 필요 시 플랫폼서 상향.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65.0 -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
