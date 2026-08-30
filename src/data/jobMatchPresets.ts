export interface JobMatchPreset {
  id: string;
  role: string;
  company: string;
  category: 'Frontend' | 'Backend' | 'Full Stack' | 'AI & Data' | 'Cloud & DevOps' | 'Mobile' | 'Security & QA' | 'Systems & Hardware';
  experienceLevel: 'Entry / Fresher' | 'Junior (0-2 Yrs)' | 'Mid-Level (2-4 Yrs)' | 'Campus Recruitment';
  requiredSkills: string[];
  description: string;
}

export const JOB_MATCH_PRESETS: JobMatchPreset[] = [
  {
    id: 'preset-frontend-react',
    role: 'Frontend Engineer (React / TypeScript)',
    company: 'TechCorp Interactive',
    category: 'Frontend',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'REST API', 'JavaScript', 'HTML5', 'CSS3', 'Git'],
    description: `We are looking for a skilled Frontend Engineer proficient in React, TypeScript, and modern UI engineering.

Responsibilities:
- Architect and develop responsive, accessible web applications with React, TypeScript, and Tailwind CSS.
- Optimize client-side state management, bundle size, and Core Web Vitals performance.
- Collaborate with product designers and backend engineers to integrate REST and GraphQL APIs.
- Write thorough unit and integration tests using Jest and React Testing Library.

Requirements:
- Strong foundations in JavaScript (ES6+), TypeScript, DOM APIs, and CSS layout engines.
- Proven experience building SPAs with React hooks, context, and modern build tooling (Vite/Webpack).
- Familiarity with version control (Git), code reviews, and CI/CD development lifecycles.
- Understanding of responsive design, web performance optimization, and cross-browser compatibility.`,
  },
  {
    id: 'preset-backend-node',
    role: 'Backend Software Engineer (Node.js / Express / SQL)',
    company: 'CloudScale Systems',
    category: 'Backend',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Node.js', 'Express', 'TypeScript', 'SQL', 'PostgreSQL', 'Redis', 'REST API', 'Docker', 'Git'],
    description: `CloudScale Systems is hiring a Backend Engineer to build robust microservices and scalable API infrastructure.

Responsibilities:
- Design, implement, and maintain high-throughput RESTful and GraphQL APIs using Node.js and TypeScript.
- Architect relational database schemas in PostgreSQL, write optimized SQL queries, and configure Redis caching layers.
- Ensure API security, authentication (JWT/OAuth), role-based access control, and rate limiting.
- Containerize services with Docker and collaborate on automated deployment pipelines.

Requirements:
- Solid background in Node.js, Express, and asynchronous runtime event loops.
- Strong knowledge of relational databases (PostgreSQL/MySQL), transactions, indexing, and data modeling.
- Solid understanding of Data Structures, Algorithms, and System Design fundamentals.
- Experience with unit testing frameworks and API documentation tooling (Swagger/OpenAPI).`,
  },
  {
    id: 'preset-fullstack-mern',
    role: 'Full Stack Developer (MERN / Next.js / TypeScript)',
    company: 'Nexus Innovations',
    category: 'Full Stack',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Next.js', 'Express', 'Tailwind', 'Git'],
    description: `Nexus Innovations is looking for a dynamic Full Stack Developer to deliver end-to-end web features.

Responsibilities:
- Build full-stack web applications using React/Next.js on the frontend and Node.js/Express on the backend.
- Design database schemas in MongoDB and PostgreSQL with robust validation and data consistency.
- Implement server-side rendering (SSR), API routes, and seamless client-side state transitions.
- Integrate third-party webhooks, payment gateways, and authentication providers.

Requirements:
- Proficiency across the full JavaScript/TypeScript stack (Client + Server + Database).
- Experience with modern ORMs/ODMs (Prisma, Mongoose, Drizzle) and relational/NoSQL databases.
- Familiarity with Git collaboration, pull requests, and automated deployment platforms (Vercel, AWS).
- Passion for clean code, component modularity, and intuitive user experiences.`,
  },
  {
    id: 'preset-java-enterprise',
    role: 'Java Enterprise Engineer (Spring Boot / Microservices)',
    company: 'Global FinTech Solutions',
    category: 'Backend',
    experienceLevel: 'Campus Recruitment',
    requiredSkills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'PostgreSQL', 'Docker', 'Kafka', 'REST API', 'OOP'],
    description: `Global FinTech Solutions is seeking an enthusiastic Java Software Engineer to engineer enterprise banking services.

Responsibilities:
- Develop scalable backend microservices using Java 17+, Spring Boot, and Spring Cloud.
- Design database tables, Hibernate/JPA mappings, and high-performance SQL queries.
- Build event-driven messaging pipelines utilizing Apache Kafka or RabbitMQ.
- Write robust automated tests with JUnit 5 and Mockito to achieve >80% code coverage.

Requirements:
- Strong foundation in Core Java, Object-Oriented Programming (OOP), Multithreading, and JVM internals.
- Hands-on experience or academic projects with Spring Boot, Spring Data JPA, and REST APIs.
- Working knowledge of SQL relational databases and transactional integrity (ACID).
- Understanding of software engineering principles: SOLID, Design Patterns, and clean architecture.`,
  },
  {
    id: 'preset-python-backend',
    role: 'Python Backend Engineer (FastAPI / Django / SQL)',
    company: 'AeroData Labs',
    category: 'Backend',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'Celery', 'Git'],
    description: `AeroData Labs is looking for a Python Backend Engineer to build high-performance data APIs and services.

Responsibilities:
- Develop asynchronous APIs using FastAPI, Pydantic, and SQLAlchemy.
- Build background task workers and message queues with Celery and Redis.
- Optimize database queries and schema migrations in PostgreSQL.
- Implement automated test suites with Pytest and maintain continuous integration workflows.

Requirements:
- Strong proficiency in Python 3.10+, async/await paradigms, and typing annotations.
- Experience with web frameworks like FastAPI, Django, or Flask.
- Knowledge of relational databases, SQL optimization, and caching strategies.
- Familiarity with Docker containerization and Git workflows.`,
  },
  {
    id: 'preset-ai-ml-engineer',
    role: 'Machine Learning Engineer (PyTorch / Scikit-Learn / LLMs)',
    company: 'Cognitive AI Research',
    category: 'AI & Data',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Python', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy', 'Docker', 'FastAPI', 'Machine Learning', 'Git'],
    description: `Cognitive AI is seeking a Machine Learning Engineer to train, fine-tune, and deploy AI models.

Responsibilities:
- Build and evaluate machine learning pipelines using PyTorch, Hugging Face Transformers, and Scikit-Learn.
- Process, clean, and vectorize unstructured text, tabular, and time-series data using Pandas and NumPy.
- Serve ML inference endpoints at low latency using FastAPI, ONNX Runtime, and Docker.
- Track model experiments, metrics, and artifact versioning using MLflow or Weights & Biases.

Requirements:
- Strong mathematical foundations in Linear Algebra, Probability, Calculus, and Statistics.
- Proficiency in Python and deep learning frameworks (PyTorch or TensorFlow).
- Experience with NLP, LLM prompt engineering, embeddings, and RAG architectures is a plus.
- Solid software engineering skills for writing maintainable, production-ready code.`,
  },
  {
    id: 'preset-data-scientist',
    role: 'Data Scientist & Analytics Engineer (SQL / Python / BI)',
    company: 'OmniMetrics Corp',
    category: 'AI & Data',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-Learn', 'Statistics', 'Tableau', 'Data Visualization'],
    description: `OmniMetrics Corp is hiring a Data Scientist to extract actionable insights and build predictive models.

Responsibilities:
- Extract and aggregate large datasets from relational warehouses using complex SQL queries and window functions.
- Conduct exploratory data analysis (EDA), hypothesis testing, and statistical modeling in Python.
- Develop interactive dashboards and business intelligence reporting.
- Build predictive algorithms for customer churn, conversion forecasting, and anomaly detection.

Requirements:
- Advanced SQL skills including subqueries, CTEs, window functions, and performance tuning.
- Strong Python capabilities with Pandas, NumPy, Matplotlib/Seaborn, and Scikit-Learn.
- Deep understanding of statistical tests, regression analysis, classification, and clustering.
- Clear communication skills for presenting analytical findings to technical and non-technical stakeholders.`,
  },
  {
    id: 'preset-devops-cloud',
    role: 'DevOps & Cloud Engineer (AWS / Kubernetes / Terraform)',
    company: 'ScaleOps Infrastructure',
    category: 'Cloud & DevOps',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Git', 'Python', 'Bash'],
    description: `ScaleOps Infrastructure is looking for a Cloud DevOps Engineer to automate cloud infrastructure and CI/CD pipelines.

Responsibilities:
- Provision and manage AWS infrastructure (EC2, S3, RDS, ECS/EKS, VPC) using Terraform (IaC).
- Maintain Kubernetes clusters, Helm charts, and containerized microservice deployments.
- Build CI/CD automation pipelines using GitHub Actions, GitLab CI, or Jenkins.
- Monitor infrastructure health, log aggregation, and uptime using Prometheus and Grafana.

Requirements:
- Hands-on experience with Linux administration, Bash scripting, and networking fundamentals.
- Understanding of Docker container lifecycle and orchestration concepts.
- Familiarity with major cloud providers (AWS, GCP, or Azure).
- Passion for infrastructure automation, zero-downtime deployments, and cloud security.`,
  },
  {
    id: 'preset-sre',
    role: 'Site Reliability Engineer (SRE / Linux / Observability)',
    company: 'Apex Cloud Platforms',
    category: 'Cloud & DevOps',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Linux', 'Python', 'Docker', 'Kubernetes', 'Prometheus', 'Grafana', 'Networking', 'Git', 'CI/CD'],
    description: `Apex Cloud Platforms is hiring an SRE to drive high availability, fault tolerance, and observability.

Responsibilities:
- Define and track Service Level Objectives (SLOs), SLIs, and Error Budgets across core systems.
- Troubleshoot distributed production outages, perform root-cause analysis (RCA), and implement post-mortems.
- Automate operational tasks and incident response workflows using Python and Go.
- Manage observability stacks (Prometheus, Grafana, OpenTelemetry, ELK).

Requirements:
- Deep familiarity with Linux operating system internals, process management, and TCP/IP networking.
- Scripting proficiency in Python, Bash, or Go.
- Understanding of distributed systems architecture, load balancing, and failure domains.
- Eagerness to build reliable, self-healing cloud applications.`,
  },
  {
    id: 'preset-mobile-react-native',
    role: 'Mobile App Developer (React Native / Cross-Platform)',
    company: 'Pulse Mobility',
    category: 'Mobile',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['React Native', 'TypeScript', 'JavaScript', 'React', 'REST API', 'Git', 'Mobile UI/UX', 'Redux'],
    description: `Pulse Mobility is seeking a passionate React Native Developer to build intuitive iOS and Android applications.

Responsibilities:
- Develop smooth 60fps mobile user interfaces using React Native, TypeScript, and native bridge modules.
- Integrate mobile hardware APIs (Camera, GPS/Geolocation, Push Notifications, Secure Storage).
- Manage offline-first data caching and seamless API synchronization.
- Assist in App Store and Google Play Store build, packaging, and release pipelines.

Requirements:
- Strong proficiency in React Native, React hooks, and TypeScript.
- Familiarity with mobile navigation paradigms (React Navigation) and state management.
- Experience consuming RESTful APIs and handling network latency/offline states.
- Understanding of iOS and Android platform UI guidelines (Material Design & Apple HIG).`,
  },
  {
    id: 'preset-android-kotlin',
    role: 'Android Developer (Kotlin / Jetpack Compose)',
    company: 'Vanguard Mobile Labs',
    category: 'Mobile',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Kotlin', 'Android SDK', 'Jetpack Compose', 'Coroutines', 'Room', 'REST API', 'MVVM', 'Git'],
    description: `Vanguard Mobile Labs is looking for an Android Developer to build modern Android applications using Kotlin.

Responsibilities:
- Build intuitive native Android UI screens with Jetpack Compose and Material 3 design principles.
- Implement MVVM/MVI architecture with Android Architecture Components, ViewModels, and StateFlow.
- Manage background operations with Kotlin Coroutines and asynchronous Flows.
- Store structured data locally using Room SQLite database.

Requirements:
- Strong knowledge of Kotlin, OOP, and Android SDK fundamentals.
- Experience with Jetpack Compose, Navigation Component, and Dependency Injection (Hilt/Koin).
- Understanding of REST API integration via Retrofit and JSON serialization.
- Familiarity with Gradle build scripts and Android Studio profiling tools.`,
  },
  {
    id: 'preset-ios-swift',
    role: 'iOS Developer (Swift / SwiftUI / Core Data)',
    company: 'Cupertino Studio Apps',
    category: 'Mobile',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Swift', 'SwiftUI', 'iOS SDK', 'Combine', 'Core Data', 'REST API', 'Git', 'Xcode'],
    description: `Cupertino Studio is hiring an iOS Developer to create fluid native applications for iOS, iPadOS, and watchOS.

Responsibilities:
- Design declarative UI layouts using SwiftUI, Combine, and UIKit interoperability.
- Structure clean app architectures utilizing MVVM-C with modern Swift concurrency (async/await).
- Implement local persistence with Core Data or SwiftData and network requests via URLSession.
- Write automated unit and UI tests using XCTest framework.

Requirements:
- Solid command of Swift syntax, memory management (ARC), protocols, and generics.
- Practical experience building and publishing iOS applications with SwiftUI.
- Understanding of Apple Human Interface Guidelines and App Store submission workflows.
- Familiarity with version control (Git) and Xcode debugging instruments.`,
  },
  {
    id: 'preset-cybersecurity-analyst',
    role: 'Cybersecurity Analyst & Security Engineer (AppSec / Network)',
    company: 'Fortress Cyber Defense',
    category: 'Security & QA',
    experienceLevel: 'Entry / Fresher',
    requiredSkills: ['Cybersecurity', 'Network Security', 'Linux', 'Python', 'OWASP', 'Vulnerability Assessment', 'Cryptography', 'Git'],
    description: `Fortress Cyber Defense is seeking a Cybersecurity Analyst to monitor threat vectors and secure cloud infrastructure.

Responsibilities:
- Conduct vulnerability assessments and security scans on web applications following OWASP Top 10 guidelines.
- Analyze network traffic, firewall logs, and intrusion detection system (IDS/IPS) alerts.
- Collaborate with engineering teams to remediate code security vulnerabilities and implement secure coding standards.
- Assist in incident response investigations and security compliance audits.

Requirements:
- Strong understanding of networking protocols (TCP/IP, DNS, TLS/SSL, HTTP/HTTPS) and OSI model.
- Knowledge of common security vulnerabilities (XSS, SQLi, CSRF, SSRF) and mitigation techniques.
- Familiarity with Linux command line, security tools (Wireshark, Nmap, Burp Suite), and Python scripting.
- Understanding of encryption, hashing, and Public Key Infrastructure (PKI).`,
  },
  {
    id: 'preset-qa-sdet',
    role: 'QA Automation & SDET Engineer (Selenium / Cypress / Playwright)',
    company: 'Precision Quality Labs',
    category: 'Security & QA',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['QA Automation', 'Selenium', 'Cypress', 'Playwright', 'JavaScript', 'Python', 'Java', 'REST API', 'Git', 'CI/CD'],
    description: `Precision Quality Labs is looking for a Software Development Engineer in Test (SDET) to automate end-to-end testing.

Responsibilities:
- Architect and execute robust automated test frameworks using Playwright, Cypress, or Selenium.
- Automate REST API testing using Postman, Supertest, or RestAssured.
- Integrate automated regression suites into CI/CD pipelines to ensure release quality.
- Identify edge cases, document reproducible bug reports, and verify fixes.

Requirements:
- Experience writing automated test scripts in JavaScript, TypeScript, Python, or Java.
- Knowledge of software QA methodologies, test plan creation, and bug lifecycle tracking.
- Understanding of web application architecture, DOM selectors, and asynchronous browser events.
- Familiarity with Git, GitHub Actions, and test reporting dashboards.`,
  },
  {
    id: 'preset-embedded-cpp',
    role: 'Embedded Systems & C++ Firmware Engineer (RTOS / IoT)',
    company: 'Quantum Micro Devices',
    category: 'Systems & Hardware',
    experienceLevel: 'Campus Recruitment',
    requiredSkills: ['C', 'C++', 'Embedded Systems', 'RTOS', 'Microcontrollers', 'Linux', 'I2C', 'SPI', 'UART', 'Git'],
    description: `Quantum Micro Devices is hiring an Embedded Systems Engineer to write low-level firmware for IoT hardware.

Responsibilities:
- Develop firmware in C and Modern C++ for ARM Cortex-M microcontrollers.
- Implement hardware communication protocols (SPI, I2C, UART, CAN, BLE, Wi-Fi).
- Design multi-threaded embedded tasks on FreeRTOS or embedded Linux.
- Debug hardware and signal integrity using oscilloscopes, logic analyzers, and JTAG debuggers.

Requirements:
- Strong proficiency in C and C++ programming, pointers, bitwise operations, and memory layout.
- Understanding of microcontroller peripherals (Timers, ADC, DAC, DMA, Interrupts).
- Knowledge of Real-Time Operating Systems (RTOS) concepts like semaphores, mutexes, and queues.
- Passion for bridging software with real-world physical devices.`,
  },
  {
    id: 'preset-data-engineer',
    role: 'Data Engineer (PySpark / Airflow / Snowflake / SQL)',
    company: 'StreamWave Analytics',
    category: 'AI & Data',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['Python', 'SQL', 'Data Engineering', 'Spark', 'Airflow', 'PostgreSQL', 'Docker', 'ETL Pipelines', 'Git'],
    description: `StreamWave Analytics is looking for a Data Engineer to construct scalable ETL/ELT pipelines and data lakes.

Responsibilities:
- Build automated data ingestion pipelines using Python, Apache Airflow, and PySpark.
- Design dimensional data models, star schemas, and warehouse tables in Snowflake/PostgreSQL.
- Implement data validation, error alerting, and pipeline monitoring.
- Optimize batch and streaming transformations for minimal compute cost and maximum speed.

Requirements:
- Advanced SQL proficiency with performance optimization for analytical workloads.
- Strong Python programming skills for data transformation and API extraction.
- Understanding of distributed computing principles (Apache Spark / Hadoop).
- Familiarity with cloud storage (S3, GCS) and workflow orchestration (Airflow, Prefect).`,
  },
  {
    id: 'preset-cloud-architect',
    role: 'Cloud Solutions Engineer (AWS / Microservices / System Design)',
    company: 'Enterprise Cloud Matrix',
    category: 'Cloud & DevOps',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['AWS', 'System Design', 'Microservices', 'Docker', 'REST API', 'SQL', 'NoSQL', 'Security', 'Git'],
    description: `Enterprise Cloud Matrix is seeking a Cloud Solutions Engineer to architect secure, highly available cloud applications.

Responsibilities:
- Design distributed system architectures adhering to cloud well-architected frameworks.
- Implement microservice communication patterns with REST APIs, gRPC, and message brokers.
- Configure secure VPC networking, IAM least-privilege policies, and encryption at rest/transit.
- Produce comprehensive system architecture diagrams and technical documentation.

Requirements:
- Working knowledge of core AWS services (Compute, Storage, Database, Networking, Security).
- Solid grasp of System Design concepts (Horizontal scaling, Caching, CAP Theorem, Sharding).
- Experience with containerized application deployment and API gateways.
- Strong analytical and technical writing skills.`,
  },
  {
    id: 'preset-product-engineer',
    role: 'Product Engineer & Solutions Developer (Full Stack / Webhooks)',
    company: 'Orbit Platform Technologies',
    category: 'Full Stack',
    experienceLevel: 'Junior (0-2 Yrs)',
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'REST API', 'SQL', 'Git', 'Webhooks', 'UI/UX Design'],
    description: `Orbit Platform Technologies is hiring a Product Engineer to bridge user experience, frontend craft, and backend APIs.

Responsibilities:
- Own product features end-to-end from user research to production deployment.
- Build intuitive user interfaces in React/TypeScript backed by reliable Node.js API endpoints.
- Integrate enterprise third-party APIs (Stripe, Slack, Salesforce, Sendgrid) via REST and webhooks.
- Measure user engagement telemetry and iterate rapidly on feedback.

Requirements:
- Strong full-stack web development skills with TypeScript, React, and Node.js.
- Empathy for user experience, design details, and visual consistency.
- Ability to rapidly prototype, test hypotheses, and solve ambiguous customer requirements.
- Strong communication and cross-functional collaboration skills.`,
  },
];
