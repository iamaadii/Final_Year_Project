# Future PRD: B2B Financing & Relationship Management

This document outlines the planned roadmap for advanced financing workflows and automated relationship management within the Nexus Three Invoice OS.

## 1. Advanced Financing Workflows: The "Handshake" Logic

### **Overview**
To balance the needs of MSMEs (Suppliers) for cash flow and Enterprises (Buyers) for risk management, we are implementing a mutual approval system for invoice financing.

### **Stakeholder Roles**
*   **MSME (Supplier)**: Initiates the "Request Finance" workflow when they need immediate cash.
*   **Enterprise (Buyer)**: "Approves" or "Verifies" the invoice for the lender.
*   **Lender (Bank/NBFC)**: Provides the funds based on the Buyer's credit profile and the verified invoice.

### **Features**
1.  **Request Finance Button**: Sellers can mark an "Approved" invoice as "Finance Requested".
2.  **Buyer Verification Dashboard**: Buyers get a dedicated tab to "Verify for Lending" any incoming financing requests from their vendors.
3.  **Automatic Payment Redirection**: Once an invoice is "Funded", the system automatically locks the payment beneficiary to the Lender's bank account instead of the Supplier's.

## 2. Professional Relationship Management (PRM)

### **Financing Visibility Toggle**
*   **Purpose**: Allow Buyers to control data privacy.
*   **Logic**: Only vendors with `isFinancingVisible` enabled on their `CounterpartyLink` can view the "Finance" badge and status on their invoices in the Seller portal.

### **Automated Onboarding**
*   **Self-Serve Invites**: MSMEs can send links to Enterprises to "Claim their Profile" and start the connection.
*   **Compliance Vetting**: Automatic check of GSTIN status during the invitation phase.

## 3. Notification & Alerting System

### **In-App Notifications**
*   **Connection Lifecycle**: Notify on send, accept, and reject.
*   **Financing Lifecycle**: Notify Buyer when an MSME requests financing; notify MSME when the request is approved.

### **Email Alerts (Future Phase)**
*   **Guest Invites**: Send an email to the counterparty's finance email if they are not yet registered on Nexus Three.
*   **Weekly Digests**: Summary of pending approvals and connection requests.
