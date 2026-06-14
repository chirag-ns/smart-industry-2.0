Smart Industry 2.0 (OrbitGuard)

AI Driven IoT Threat Detection and Automated Containment Platform

Abstract

OrbitGuard is an intelligent monitoring and containment platform designed to detect behavioural anomalies and security threats in Internet of Things networks using machine learning driven analysis and automated response.

Modern IoT ecosystems consist of billions of interconnected devices continuously generating telemetry data. Traditional monitoring systems are reactive and depend heavily on rule based alerts, which often results in delayed threat detection.

OrbitGuard introduces a proactive architecture that continuously analyses device behaviour, detects anomalies using artificial intelligence, calculates dynamic trust scores for devices, and automatically isolates suspicious nodes before threats propagate across the network.

The platform is deployed using containerized infrastructure to simulate a distributed IoT ecosystem and demonstrate scalable AI driven security monitoring.

Problem

IoT networks face significant security challenges.

Large scale telemetry streams are difficult to analyse in real time.

Many IoT devices operate with minimal behavioural monitoring once deployed.

Security incidents are typically detected only after compromise has occurred.

Manual response mechanisms slow down containment and increase network exposure.

Existing monitoring tools struggle to identify subtle behavioural anomalies across large distributed device networks.

These limitations create an environment where malicious behaviour such as botnet participation, abnormal communication patterns, or sensor manipulation can remain undetected.

Solution

OrbitGuard introduces an intelligent security pipeline that continuously monitors device telemetry and identifies abnormal behaviour using machine learning.

The system automatically evaluates device behaviour using a trust scoring model and enforces containment policies when security risks are detected.

Core capabilities

Continuous telemetry ingestion
Behavioural anomaly detection using AI
Dynamic trust score evaluation for each device
Policy based validation of device behaviour
Automated containment of suspicious devices
Real time monitoring through a Security Operations dashboard

System Architecture
4

OrbitGuard follows a layered modular architecture designed for scalable monitoring and analysis.

Architecture pipeline

IoT Device Simulation

Simulated devices generate telemetry such as sensor readings, operational logs, and communication patterns.

Telemetry Stream Processing

Telemetry data flows through a simulated Docker network and is forwarded to the backend API.

Backend API Layer

The backend service processes telemetry events, communicates with the AI engine, calculates trust scores, and enforces security policies.

Database Layer

MongoDB stores telemetry records, anomaly logs, device metadata, and trust score history.

AI Analysis Engine

The AI module analyses behavioural drift and identifies abnormal device activity.

Trust Score Engine

Each device receives a reliability score calculated from behavioural drift and policy violations.

Policy Validation Layer

Device actions are evaluated against predefined security policies.

Containment Controller

Devices identified as suspicious are automatically isolated from the network.

SOC Dashboard

Security operators can monitor device behaviour, anomaly alerts, and containment actions in real time.

Architecture Workflow

IoT Devices generate telemetry data
Telemetry flows through the Docker network simulation
Backend API receives telemetry events
MongoDB stores telemetry and device records
AI engine analyses behavioural patterns
Trust score is calculated for each device
Policy engine checks compliance rules
Anomaly detection flags suspicious behaviour
Containment module isolates risky devices
SOC dashboard visualizes system activity

Technology Stack

Backend

Node.js
Express.js

Artificial Intelligence

Python
Machine learning based anomaly detection
Behavioural drift analysis

Database

MongoDB document oriented database

Infrastructure

Docker containerization
Docker networking for distributed simulation

Visualization

Web based SOC monitoring dashboard

Artificial Intelligence Engine

The AI engine continuously analyses telemetry streams to detect deviations from expected behaviour.

Instead of relying only on predefined rules, the system learns behavioural baselines from historical telemetry.

Key AI functions

Behavioural drift detection
Pattern comparison between historical and current telemetry
Real time anomaly classification
Integration with trust score evaluation

This approach allows the system to identify unknown threats and zero day anomalies.

Trust Score Model

OrbitGuard evaluates device reliability using a dynamic trust scoring model.

Initial trust score

Trust = 100

Penalty logic

Trust decreases when behavioural drift is detected
Trust decreases when policy violations occur

Trust model

Trust = 100
Trust = Trust minus drift score multiplied by 50
Trust = Trust minus violations multiplied by 20

Explanation

Drift score represents behavioural deviation from normal patterns.

Violations represent explicit security policy breaches.

Higher drift values and violations significantly reduce trust scores to prioritize security risk mitigation.

Devices with critically low trust scores trigger containment actions.

Dataset Generation

OrbitGuard generates training data through simulated telemetry.

Device simulators produce

Normal device behaviour patterns
Randomized anomalies
Sensor spikes and irregular readings
Communication pattern deviations
Policy violation events

This synthetic dataset enables training and evaluation of anomaly detection models without requiring real world IoT infrastructure.

Containerized Deployment

OrbitGuard uses Docker to create an isolated distributed environment.

Containers represent

IoT device simulators
Backend API service
AI analysis engine
MongoDB database
Monitoring dashboard

Docker networking allows containers to communicate internally as if they were separate devices within a real network.

Benefits

Service isolation
Reproducible development environments
Scalable deployment architecture
Simplified system orchestration

Container Communication Model

Docker networking enables internal service discovery between containers.

IoT simulators send telemetry to the backend container.

Backend services communicate with

MongoDB container for data storage
AI engine container for anomaly analysis
Dashboard container for monitoring visualization

This microservice architecture replicates real enterprise IoT monitoring platforms.

GitHub Project Structure

A clean project structure improves maintainability, readability, and deployment.

orbitguard

backend
    server.js
    routes
    controllers
    trust_engine.js
    policy_engine.js

ai_engine
    ai_engine.py
    anomaly_model.py
    dataset_generator.py

iot_simulator
    device_simulator.py
    telemetry_generator.py

database
    mongo_config.js
    schemas

dashboard
    frontend
    api_integration

docker
    docker-compose.yml
    Dockerfiles

config
    environment_config.js

docs
    architecture
    diagrams
    design_notes

README.md
requirements.txt
package.json

This structure separates system components into clear modules to improve development and scalability.

Installation

Prerequisites

Node.js
Python
Docker
MongoDB

Clone repository

git clone https://github.com/your-repository/orbitguard.git
cd orbitguard

Install backend dependencies

npm install

Install AI dependencies

pip install -r requirements.txt

Start containers

docker compose up
Running the System

Start backend server

node server.js

Start AI engine

python ai_engine.py

Open the SOC dashboard to monitor device activity and anomaly alerts.

Example Security Scenario

A device begins transmitting abnormal telemetry such as irregular sensor spikes or unexpected network communication.

The AI engine detects behavioural drift when compared to historical baseline behaviour.

The drift score increases and reduces the device trust score.

Simultaneously the policy engine detects unusual communication patterns and records violations.

The trust score falls below the security threshold.

OrbitGuard automatically isolates the device from the network.

The SOC dashboard immediately displays the anomaly and containment action.

Key Advantages

Proactive security monitoring rather than reactive detection

AI driven anomaly detection capable of identifying unknown threats

Automated containment mechanisms that limit lateral network propagation

Scalable microservice architecture

Containerized infrastructure enabling rapid deployment

Flexible database optimized for high volume telemetry

Hackathon Innovation Highlights

AI driven behavioural monitoring for IoT security

Dynamic trust score based device risk assessment

Fully automated containment pipeline

Real time SOC dashboard visualization

Containerized IoT network simulation

Complete end to end security monitoring architecture
