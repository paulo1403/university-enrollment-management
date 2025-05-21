# University Enrollment Management System

## Overview

The University Enrollment Management System is a modern, full-stack web application designed to streamline the academic enrollment process for students, professors, and administrators. Built with Next.js, TypeScript, and Prisma, it offers a robust and secure platform for managing courses, student registrations, academic records, and more.

## Key Features

* **User Authentication & Authorization:**
    * Secure user login with email and password.
    * **Two-Factor Authentication (2FA)** for enhanced security.
    * Role-based access control for **Students**, **Professors**, and **Admins**.
* **Student Module:**
    * Browse available courses with filters (modality, campus).
    * **Course Enrollment:** Register for courses, with prerequisite checks.
    * View personal academic history (enrolled courses, grades).
    * Monitor financial status (account balance, payments).
* **Professor Module:**
    * View assigned courses.
    * Access list of enrolled students for each course.
    * Manage grades for students in their courses.
* **Administrator Module:**
    * Full user management (create, update, delete students, professors, admins).
    * Comprehensive course management (create, update, delete courses, manage prerequisites, assign professors, set capacity).
    * Manage campus locations, rooms, and academic periods.
    * Financial oversight (manage student accounts, payments, fees).
    * System settings configuration.
    * Audit logging for tracking key system actions.
* **Course Management:**
    * Detailed course information including code, name, description, credits, and capacity.
    * **Course Modality:** Support for `On-site` (Presencial) and `Virtual` (Virtual) courses.
    * **Campus Assignment:** Courses linked to specific university campuses.
    * **Prerequisite System:** Enforce dependencies between courses for enrollment.
    * **Class Scheduling:** Define specific class times (day, start/end time, room).
* **Academic Periods:** Organize courses and enrollments by academic semesters or terms.
* **Financial Management:** Basic system for student account balances and payments.
* **Audit Logging:** Track significant system actions for security and compliance.

## Technology Stack

* **Frontend:**
    * **Next.js (App Router):** React framework for building powerful web applications.
    * **TypeScript:** Enhances code quality and developer experience.
    * **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
    * **Shadcn/ui:** Reusable, customizable UI components built with Radix UI and Tailwind CSS.
    * **React Hook Form:** For efficient form management and validation.
    * **Zod:** TypeScript-first schema validation library.
* **Backend:**
    * **Next.js API Routes:** For handling server-side logic and database interactions.
    * **NextAuth.js:** Flexible authentication solution for Next.js.
    * **bcryptjs:** For secure password hashing.
    * **speakeasy:** For implementing Time-based One-Time Passwords (TOTP) for 2FA.
    * **crypto-js:** For encrypting sensitive 2FA secrets in the database.
* **Database:**
    * **Prisma:** Modern ORM for seamless database interaction.
    * **SQLite (Development):** Lightweight file-based database for local development and rapid prototyping.
    * **PostgreSQL / MySQL (Production):** Robust relational databases for production environments.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

* Node.js (LTS version recommended)
* npm or Yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/paulo1403/university-enrollment-management
    cd university-enrollment-management
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root of your project and add the following variables. **Replace the placeholder values** with securely generated random strings.

    ```env
    # Database Configuration (SQLite for local development)
    DATABASE_URL="file:./dev.db"

    # Security Secrets (IMPORTANT: Replace with very long, random strings!)
    # You can generate these using tools like `openssl rand -base64 32` for ENCRYPTION_SECRET
    # and `openssl rand -base64 64` for NEXTAUTH_SECRET.
    ENCRYPTION_SECRET="YOUR_VERY_LONG_RANDOM_ENCRYPTION_SECRET"
    NEXTAUTH_SECRET="YOUR_VERY_LONG_RANDOM_NEXTAUTH_SECRET"
    ```

4.  **Setup the Database:**
    Generate the Prisma client and apply the database migrations. This will create the `dev.db` SQLite file.

    ```bash
    npx prisma migrate dev --name init_full_schema
    ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Migration (SQLite to PostgreSQL/MySQL)

When ready for a production environment, you can easily migrate the database provider in `prisma/schema.prisma` and update your `DATABASE_URL` in `.env`. Prisma's migration system will handle the schema synchronization.

## Contributing

We welcome contributions! Please feel free to open issues or submit pull requests.

## License

[Choose and specify your license, e.g., MIT, Apache 2.0]
