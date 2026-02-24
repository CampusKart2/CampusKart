pipeline {
  agent { label 'dev' }   // <-- must match the label on your Dev node

  options {
    skipDefaultCheckout(true) // prevents Jenkins from checking out twice
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify (Dev Server)') {
      steps {
        sh '''
          echo "NODE_NAME=$NODE_NAME"
          echo "WORKSPACE=$WORKSPACE"
          hostname
          pwd
          ls -la
        '''
      }
    }
  }
}