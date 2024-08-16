# Green-Visa

This repository is made for the new project green visa. Made to refresh the green visa website by using different technologies. React and material UI are used for this purpose

## How to create a new react + vite folder

1. Open terminal and go to the folder you want to create the project.
2. Node js has to be installed for the next procedure.
3. Write the following command -> `npm create vite@latest nome-cartella --template react`.
4. Choose React
5. Digit Javascript

Now the folder `nome-cartella` is created

## On VS Code

1. Open `nome-cartella` folder on VS Code
2. Open On VS Code the terminal
3. Write `npm i` or `npm install`. A new folder npm modules is created
4. Last run `npm run dev` to execute the server
5. `CTRL + C` to close the server

## React Folder Composition

- **node_modules**: Contains packages installed via `npm i`. Essential for the project to work.
- **public**: Contains public resources like images and favicon.
- **src**: Source folder with all the website's code files.
- **.eslintrc.cjs**: Defines code linting rules. Ensures code is written in a specific way.
- **index.html**: The entry point and main page of the site.
- **package.json**: Manages dependencies, scripts, and configurations for the project. Specifies libraries and tools for building, running, and previewing the project.
- **package-lock.json**: Lists all the dependencies and their versions. Ensures consistent installs.
- **vite.config.js**: Configuration file for Vite, the build tool. Allows adding plugins and dependencies.

## Docker e Docker Compose

Quickstart:

```
docker compose down -v && docker compose up --build
```

Per creare l'immagine dell'appplicazione:

```
sudo docker build -t text-learn-app .
```

Per avviarla:

```
sudo docker-compose up
```

Docker si basa su molte dinamiche di caching per creare l'immagine.
Può essere necessario rimuoverla e ricrearla.
Per rimuovere tutti le possibili immagini cachate:

```
sudo docker system prune
```

Alcuni comandi utili:

```
docker-compose up --build
```

ricostruisce e avvia i container.

```
docker-compose down -v
docker volume prune
```

il primo comando ferma ed elimina tutti i volumi e container.
il secondo comando rimuove tutti i volumi rimasti non utilizzati.

# Publication Pipeline

### Step 1: Check Current Branch

Use the following command to check which branch you are on:

```bash
git status
```

To switch to a different branch, use:

```bash
git checkout <branch-name>
```

### Step 2: Prepare Changes for Commit

Stage your changes with:

```bash
git add -A
```

### Step 3: Commit Changes

Commit your changes with a descriptive message:

```bash
git commit -m "[prog-prot][<commit_type>]: <description_of_the_change>"
```

### Step 4: Push Changes

Push your changes to the remote repository:

```bash
git push origin <branch-name>
```

## Creating a Branch and Syncing with Main

### Creating a New Branch

To work on a new feature or fix an issue, create a new branch:

```bash
git checkout -b <branch-name>
```

Replace `<branch-name>` with a descriptive name for the new branch.

### Syncing with the Main Branch

Keep your branch up-to-date with the latest changes from the main branch:

```bash
git checkout main
git pull origin main
git checkout <branch-name>
git merge main
```

This ensures your branch is aligned with the latest changes in the main branch.

### Creating a Pull Request (PR)

When ready to merge your changes into the main branch, create a Pull Request:

1. Ensure all changes are committed in your branch.
2. Go to the repository hosting platform (e.g., GitHub).
3. Select your branch and start a new Pull Request towards the main branch.
4. Provide a detailed description of the changes made.

## Commit Structure

To maintain a clean and understandable project history, follow a standard commit structure:

### Commit Message Syntax

The general form is:

```plaintext
[<commit_type>]: <description_of_the_change>
```

Each commit message should be clear and descriptive. Use a verbose and specific syntax. Examples include:

- `[ADD]: Added feature X`
- `[FIX]: Fixed bug Y`
- `[IMP]: Improved performance of Z`

### Atomicity of Commits

Try to keep commits atomic, meaning one feature or fix per commit. This makes managing changes and rolling back easier if necessary. For each single feature, create a commit, then push changes at the end.
