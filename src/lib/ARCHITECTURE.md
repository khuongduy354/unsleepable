# Application Architecture

## Overview

The application follows a layered architecture to promote separation of concerns, testability, and maintainability. Key components include:

- **Repositories** (`src/lib/repositories/`): Handle data access and persistence logic.
- **Services** (`src/lib/services/`): Contain business logic and orchestrate operations using repositories.
- **API Routes** (`src/app/api/`): Entry points that consume services to handle HTTP requests.
- **Dependency Injection (DI)** (`src/lib/setup/`): Managed in setup files to wire dependencies and provide singleton instances. 
- **Interfaces & DTOs** (`src/lib/types/`): Define contracts and data structures for communication between layers.


# Examples  


### Flow
Controllers (/src/app/api) -> setup -> services -> repositories 

Each layer have an interface that define the contract for that layer. Adding a specific implementation in the /src/lib/* files

`src/lib/repositories/supabase.repository.ts`: Supabase implementation of repository interfaces.



### File Structure

`src/app/api`: controllers

`src/lib/setup/production-setup.ts`: current service and repository setup for production environment. 

`src/lib/setup/test-setup.ts`: test-specific setup with mock implementations. (NOT IMPLEMENTED YET)

`src/lib/setup/index.ts`: main entry point:  

for e.g: We can switch up between production and test just by changing this file.
