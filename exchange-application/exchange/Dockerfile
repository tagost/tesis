FROM maven:3.8.1-adoptopenjdk-11 AS build

WORKDIR /usr/src/app
USER root
# Cache dependencies
COPY pom.xml .
#RUN mvn clean dependency:resolve
#RUN mkdir -p /usr/src/app/target
# Build native image
COPY src /usr/src/app/src
RUN mvn clean package 
EXPOSE 8080
CMD ["java","-jar", "target/exchange-1.0-SNAPSHOT-runner.jar"]
