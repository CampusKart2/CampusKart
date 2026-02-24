pipeline {
  agent { label 'dev-agent' }

  options {
    skipDefaultCheckout(true)
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Frontend') {
      steps {
        dir('Frontend') {
          sh '''
            npm ci
            npm run build
          '''
        }
      }
    }

    stage('Deploy to ~/CampusKart') {
      steps {
        sh '''
          mkdir -p ~/CampusKart
          rsync -av --delete ./ ~/CampusKart/
        '''
      }
    }
  }
}