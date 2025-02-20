# DocWallet

> [!NOTE]
> DocWallet is a secure document management application designed to help users store, organize, and manage their personal documents with automated reminders and government platform integration.

## **Description**

Development of an application that allows users to securely store, organize, and manage their personal documents. The app will send automatic reminders about expiration dates, provide updated information on procedures and requirements, and sync with government platforms to streamline renewals. Additionally, it will feature personalized categorization, biometric authentication, and data encryption to ensure information security.

## **Objectives**

1. **Centralized document management:** Provide a secure platform for users to store digital copies of essential documents.
2. **Automated expiration alerts:** Notify users in advance when documents are nearing expiration to prevent delays and extra costs.
3. **Seamless synchronization:** Integrate with government websites to provide up-to-date information on document renewals and procedural changes.

## Problem to Solve

> [!IMPORTANT] 
> Many people struggle with managing personal documents due to missed expiration dates, unclear requirements, and complex bureaucratic processes. This often leads to extra costs, wasted time, and stress.

Recent studies reveal the magnitude of this challenge, with 46% of professionals regularly struggling to find necessary information and approximately 83% recreating existing documents because they can't locate originals \[1]. The problem extends beyond simple organization - users face document retrieval complexity, high processing cycle times, and significant security concerns \[5].

Information on procedures is scattered across multiple platforms, making access difficult. There is no integrated solution for storing documents, receiving renewal alerts, and accessing clear procedural guidelines. The impact of poor document management is substantial, with organizations losing up to 20% productivity due to inefficient systems \[3].

Our app solves this by offering a centralized platform where users can store digital documents, get expiration reminders, and access automated information on requirements and procedures. This addresses key challenges identified in the industry, including limited accessibility, metadata management difficulties, and escalating storage costs \[5].

## **Functional Requirements**

> [!TIP]
> These core features ensure secure document management and easy access for users.

1. **Secure Document Storage** – Users can upload and store digital copies of important documents (INE, passport, driver's license, CURP, RFC, etc.).
2. **Share documents** — The application will allow users to share stored documents securely with other individuals or platforms.
3. **Show the PDF in the app** — The app will include an integrated PDF viewer, enabling users to open and view stored documents without needing external applications.
4. **Expiration Notifications** – The system sends automated alerts when a document is nearing expiration.
5. **Custom Organization** – Users can categorize documents using personalized tags (e.g., personal, work, legal, vehicle-related).
6. **Biometric Authentication** – Access to the app is secured using fingerprint or facial recognition.
7. **2FA Support** - Enable token validation with passwords manager
8. **Profile Management** – Allow users to organize documents

## Optional Requirements

> [!NOTE]
> These features enhance the user experience but are not critical for the initial release.

1. **Synchronization with Government Websites** – The app retrieves official data to notify users about renewals and procedural updates.
2. **Smart Procedure Assistant** – A step-by-step guide provides users with the necessary requirements and documents for completing specific procedures.
3. **Backup and Recovery** – Allows users to recover documents in case of device loss or change.

## **Non-Functional Requirements**

> [!IMPORTANT]
> These requirements ensure the application's security, usability, and performance standards.

1. **Compliance with Legal Standards** – The app must adhere to the **LFPDPPP** and any other relevant privacy regulations.
2. **Data Security and Encryption** – All stored documents and personal data must be encrypted to ensure confidentiality.
3. **User-Friendly Interface** – The application must have an intuitive design, making document management easy and accessible.
4. **Performance Efficiency** – The app should process document scans, information retrieval and analysis, and notifications efficiently.
5. **Cross-Platform Compatibility** – The application should work seamlessly on both Android and iOS devices.

## State-of-the-Art Analysis

This section examines existing approaches to document management and how DocWallet innovates beyond current solutions.

### Current Market Solutions

The document management system market is projected to grow from $7.16 billion in 2024 to $24.91 billion by 2032, demonstrating significant industry expansion \[2]. Current solutions fall into several categories:

Traditional Paper Systems continue to dominate many organizations, with 50% of business waste coming from paper and average costs of $20 per document to manage \[3]. This approach suffers from accessibility limitations and high risk of document loss.

Cloud Storage Solutions have achieved widespread adoption (89%) but face significant challenges - 80% of organizations report wasteful spending and security breaches in their cloud implementations \[1]. While offering basic file storage, these solutions typically lack specialized document management features.

Enterprise Document Management Systems, despite their sophistication, have limited penetration with only 25% of enterprises currently utilizing them \[2]. These systems often involve complex integration requirements and substantial implementation costs.

### DocWallet's Innovative Approach

DocWallet differentiates itself by addressing key limitations of existing solutions \[1]:

1. Security and Accessibility Balance - While 74% of workers need mobile document access, our solution provides secure mobile-first access with biometric authentication and 2FA support.

2. Integration Capabilities - Unlike current systems where only 26% integrate with core applications DocWallet offers seamless synchronization with government platforms and essential services.

3. User-Centric Design - Addressing the challenge where 83% of users lose time to document versioning issues, our platform provides intuitive organization and automated expiration tracking.

## Word Package Description

> [!NOTE]
> Project timeline and deliverables overview

| Deliverable                | Description                                       | Due Date   |
|----------------------------|---------------------------------------------------|------------|
| Requirements Specification | Define functional and non-functional requirements | 11/02/2025 |
| UI/UX Design               | Create wireframes, prototypes, UI components      | 13/02/2025 |
| Backend Development        | API development, database setup                   | 21/03/2025 |
| Frontend Development       | Mobile app UI and features implementation         | 21/03/2025 |
| Testing & QA               | Unit, integration, and user testing               | 28/03/2025 |
| Deployment                 | Submission to Google Play / App Store             | TBD        |
| Post-Launch Support        | Bug fixes, updates, monitoring                    | TBD        |

### Risk Mitigation Plan Example

> [!WARNING]
> Key risks and their mitigation strategies must be carefully considered for project success.

| Risk                 | Impact                                                                                                       | Mitigation Strategy                                                                                                                                                               |
|----------------------|--------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Data security issues | Users don't trust our app to upload their documents.                                                         | - Implement strategic partnerships to encourage its use.<br>- Ensure that biometric Authentication and 2FA Support.<br>- Ensure compliance with security policies.                |
| Storage              | Users are unable to upload their documents or they're unable to access it.                                   | - Support with cloud providers to ensure capacity and access.                                                                                                                     |
| Model performance    | The information being retrieved from the uploaded documents is inaccurate, affecting the settings of alarms. | - Refining the existing ML model or exploring alternative models.                                                                                                                 |
| Compatibility Issues | The app may not work properly on all devices or OS versions.                                                 | - Perform cross-platform testing with React Native testing tools (Appium, Detox) and optimize for both iOS and Android.<br>- Ensure backward compatibility for older OS versions. |
| App store rejections | The app could be rejected due to policy violations or security concerns.                                     | - Review the problematic sections of the app, make corrections and re-try the submission.                                                                                         |

### Presentation 

https://www.canva.com/design/DAGdmn20U_w/91MxIGI3pKgqPLqchkpK4g/edit?utm_content=DAGdmn20U_w&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

## References

- \[1] D. Kostya, “100 Document Management Statistics to Make You Rethink Your Processes in 2025,” FileCenter Blog, Nov. 11, 2024. https://www.filecenter.com/blog/document-management-statistics/ (accessed Feb. 20, 2025).

- \[2] Fortune Business Insights, “Document Management System Market Size, Share, Trends 2032,” Fortunebusinessinsights.com, 2024. https://www.fortunebusinessinsights.com/document-management-system-market-106615 (accessed Feb. 20, 2025).

- \[3] Ripcord Team, “The True Cost of Poor Document Management,” Ripcord.com, Dec. 17, 2020. https://blog.ripcord.com/resources/the-true-cost-of-poor-document-management (accessed Feb. 20, 2025).

- \[4] ITA, “Mexico - Digital Economy,” International Trade Administration, Sep. 20, 2024. https://www.trade.gov/country-commercial-guides/mexico-digital-economy (accessed Feb. 20, 2025).

- \[5] H. A. Malak, “11 Critical Document Management Challenges in 2025,” Information Management Simplified, Nov. 25, 2021. https://theecmconsultant.com/document-management-challenges/ (accessed Feb. 20, 2025).
