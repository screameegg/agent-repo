FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -Dmaven.test.skip=true dependency:go-offline

COPY src ./src
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:17-jre

WORKDIR /app

ENV TZ=Asia/Shanghai
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

RUN groupadd -r lobster \
    && useradd -r -g lobster lobster \
    && mkdir -p /app/uploads \
    && chown -R lobster:lobster /app

COPY --from=build /workspace/target/*.jar /app/app.jar

USER lobster

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
