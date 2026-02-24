pipeline {
  agent { label 'dev' }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Verify') {
      steps {
        sh 'hostname; pwd; ls -la'
      }
    }
  }
}