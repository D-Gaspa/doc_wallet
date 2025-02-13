# DocWallet

> [!NOTE]
> DocWallet is a secure document management application designed to help users store, organize, and manage their personal documents with automated reminders and government platform integration.

## **Description**

Development of an application that allows users to securely store, organize, and manage their personal documents. The app will send automatic reminders about expiration dates, provide updated information on procedures and requirements, and sync with government platforms to streamline renewals. Additionally, it will feature personalized categorization, biometric authentication, and data encryption to ensure information security.

## **Objectives**

1. **Centralized document management:** Provide a secure platform for users to store digital copies of essential documents.
2. **Automated expiration alerts:** Notify users in advance when documents are nearing expiration to prevent delays and extra costs.
3. **Seamless synchronization:** Integrate with government websites to provide up-to-date information on document renewals and procedural changes.

## **Problem to solve**

> [!IMPORTANT]
> Many people struggle with managing personal documents due to missed expiration dates, unclear requirements, and complex bureaucratic processes. This often leads to extra costs, wasted time, and stress.

Information on procedures is scattered across multiple platforms, making access difficult. There is no integrated solution for storing documents, receiving renewal alerts, and accessing clear procedural guidelines.

Our app solves this by offering a centralized platform where users can store digital documents, get expiration reminders, and access automated information on requirements and procedures.

## **Functional Requirements**

> [!TIP]
> These core features ensure secure document management and easy access for users.

4. **Secure Document Storage** – Users can upload and store digital copies of important documents (INE, passport, driver's license, CURP, RFC, etc.).
5. **Share documents** — The application will allow users to share stored documents securely with other individuals or platforms.
6. **Show the PDF in the app** — The app will include an integrated PDF viewer, enabling users to open and view stored documents without needing external applications.
7. **Expiration Notifications** – The system sends automated alerts when a document is nearing expiration.
8. **Custom Organization** – Users can categorize documents using personalized tags (e.g., personal, work, legal, vehicle-related).
9. **Biometric Authentication** – Access to the app is secured using fingerprint or facial recognition.
10. **2FA Support** - Enable token validation with passwords manager
11. **Profile Management** – Allow users to organize documents

## Optional Requirements

> [!NOTE]
> These features enhance the user experience but are not critical for the initial release.

12. **Synchronization with Government Websites** – The app retrieves official data to notify users about renewals and procedural updates.
13. **Smart Procedure Assistant** – A step-by-step guide provides users with the necessary requirements and documents for completing specific procedures.
14. **Backup and Recovery** – Allows users to recover documents in case of device loss or change.

## **Non-Functional Requirements**

> [!IMPORTANT]
> These requirements ensure the application's security, usability, and performance standards.

1. **Compliance with Legal Standards** – The app must adhere to the **LFPDPPP** and any other relevant privacy regulations.
2. **Data Security and Encryption** – All stored documents and personal data must be encrypted to ensure confidentiality.
3. **User-Friendly Interface** – The application must have an intuitive design, making document management easy and accessible.
4. **Performance Efficiency** – The app should process document scans, information retrieval and analysis, and notifications efficiently.
5. **Cross-Platform Compatibility** – The application should work seamlessly on both Android and iOS devices.

## Word Package Description

> [!NOTE]
> Project timeline and deliverables overview

|Deliverable|Description|Due Date|
|---|---|---|
|Requirements Specification|Define functional and non-functional requirements|11/02/2025|
|UI/UX Design|Create wireframes, prototypes, UI components|13/02/2025|
|Backend Development|API development, database setup|21/03/2025|
|Frontend Development|Mobile app UI and features implementation|21/03/2025|
|Testing & QA|Unit, integration, and user testing|28/03/2025|
|Deployment|Submission to Google Play / App Store|TBD|
|Post-Launch Support|Bug fixes, updates, monitoring|TBD|

### Risk Mitigation Plan Example

> [!WARNING]
> Key risks and their mitigation strategies must be carefully considered for project success.

| Risk                 | Impact                                                                                                       | Mitigation Strategy                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data security issues | Users don't trust our app to upload their documents.                                                         | - Implement strategic partnerships to encourage its use.<br>- Ensure that biometric Authentication and 2FA Support.<br>- Ensure compliance with security policies.                |
| Storage              | Users are unable to upload their documents or they're unable to access it.                                   | - Support with cloud providers to ensure capacity and access.                                                                                                                     |
| Model performance    | The information being retrieved from the uploaded documents is inaccurate, affecting the settings of alarms. | - Refining the existing ML model or exploring alternative models.                                                                                                                 |
| Compatibility Issues | The app may not work properly on all devices or OS versions.                                                 | - Perform cross-platform testing with React Native testing tools (Appium, Detox) and optimize for both iOS and Android.<br>- Ensure backward compatibility for older OS versions. |
| App store rejections | The app could be rejected due to policy violations or security concerns.                                     | - Review the problematic sections of the app, make corrections and re-try the submission.                                                                                         |
### Presentation 
https://www.canva.com/design/DAGdmn20U_w/91MxIGI3pKgqPLqchkpK4g/edit?utm_content=DAGdmn20U_w&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton


