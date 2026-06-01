# Exit script on error
$ErrorActionPreference = "Stop"

# Function to check Node.js installation and version
function Check-NodeVersion {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = (& node -v).TrimStart("v")
        $nodeMajorVersion = $nodeVersion.Split(".")[0]
        if ([int]$nodeMajorVersion -ge 12) {
            Write-Output "Node.js version $nodeVersion is already installed."
            return $true
        } else {
            Write-Output "Node.js version $nodeVersion is below 12. Will update Node.js."
            return $false
        }
    } else {
        Write-Output "Node.js is not installed. Will install the latest version of Node.js."
        return $false
    }
}

# Function to install the latest Node.js
function Install-Node {
    Write-Output "Downloading and installing the latest version of Node.js..."

    # Get the latest version URL dynamically
    $latestNodeVersionPage = Invoke-RestMethod -Uri "https://nodejs.org/dist/latest/"
    $latestNodeUrl = "https://nodejs.org/dist/latest/node-v$($latestNodeVersionPage.version)-x64.msi"

    # Download and install Node.js
    Invoke-WebRequest -Uri $latestNodeUrl -OutFile "$env:TEMP\nodejs.msi"
    Start-Process msiexec.exe -ArgumentList "/i `"$env:TEMP\nodejs.msi`" /quiet /norestart" -Wait
    Remove-Item "$env:TEMP\nodejs.msi"
    Start-Sleep -Seconds 5
}

# Install Node.js if not present or if version is below 12
if (-not (Check-NodeVersion)) {
    Install-Node
}

# Run npm install with no optional dependencies
Write-Output "Running npm install --no-optional..."
Start-Process "npm" -ArgumentList "install --no-optional" -Wait

# Function to check if PM2 is installed and install it if not
function Install-PM2 {
    if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
        Write-Output "PM2 is not installed. Installing PM2..."
        Start-Process "npm" -ArgumentList "install -g pm2" -Wait
    } else {
        Write-Output "PM2 is already installed."
    }
}

# Set up PM2 to run the Node.js app on boot
function Setup-PM2-Startup {
    # Start the Node.js app with PM2 using the start script in package.json
    pm2 start npm --name "nodeapp" -- start

    # Save the PM2 process list
    pm2 save

    # Generate a command to set up PM2 as a startup service
    $startupCommand = pm2 startup | Out-String

    # Execute the startup command if it’s generated correctly
    if ($startupCommand) {
        # Manually configure the Task Scheduler task for PM2 to run without needing a user login
        $action = New-ScheduledTaskAction -Execute "pm2" -Argument "resurrect"
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount

        Register-ScheduledTask -TaskName "PM2_Autostart" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "PM2 Autostart for Node.js app on boot without user login"
        Write-Output "PM2 startup configuration completed successfully."
    } else {
        Write-Output "Failed to generate PM2 startup command."
    }
}

function Setup-Npm-Task {
    $folderName = "\STInfotech\" # Specify the folder name
    $taskName = "DashboardSvc_Autostart" # Task name
    $workingDirectory = (Get-Location).Path # Set your desired working directory
    Write-Output "Working directory is '$workingDirectory'."

    # Ensure task path and name are consistent
    try {
        $existingTask = Get-ScheduledTask -TaskPath $folderName -TaskName $taskName -ErrorAction Stop
        Write-Output "Task '$taskName' found in folder '$folderName'. Deleting it."
        Unregister-ScheduledTask -TaskPath $folderName -TaskName $taskName -Confirm:$false
        Write-Output "Existing task '$taskName' deleted successfully."
    } catch {
        Write-Output "Task '$taskName' does not exist in folder '$folderName'. Proceeding with creation."
    }

    # Define the task components
    $action = New-ScheduledTaskAction -Execute "npm" -Argument "start" -WorkingDirectory $workingDirectory
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartInterval ([TimeSpan]::FromMinutes(1)) -RestartCount 10
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    # Register the task in the specified folder
    try {
        Register-ScheduledTask -TaskPath $folderName -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "NPM Autostart for nodejs dashboard app on boot without user login"
        Write-Output "NPM startup task '$taskName' configuration completed successfully in folder '$folderName'."
    } catch {
        Write-Output "Failed to register the task. Check for conflicts or folder issues."
        throw $_
    }
}


# Set-ExecutionPolicy RemoteSigned -Scope Process -Force

# Install PM2 if not present
# Install-PM2

# Set up PM2 to manage the Node.js app on startup
# Setup-PM2-Startup

# Call the function to execute
Setup-Npm-Task

Write-Output "Bootstrap setup complete."
