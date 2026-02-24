pipeline {
    agent dev-agent

    stages {
        stage('Checkout Repository') {
            steps {
                checkout scm
            }
        }

        stage('Verify Workspace') {
            steps {
                sh '''
                    echo "Current directory:"
                    pwd
                    echo "Repository contents:"
                    ls -la
                '''
            }
        }
    }
}