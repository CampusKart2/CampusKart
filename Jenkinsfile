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
	
	stage('Smoke (testRigor)') {
  steps {
    withCredentials([string(credentialsId: 'TESTRIGOR_TOKEN', variable: 'TR_TOKEN')]) {
      sh '''
        curl -X POST \
  -H 'Content-type: application/json' \
  -H 'auth-token: 87effdd8-8baa-46bb-bf0e-d43b9ce20253' \
  --data '{ "storedValues": { "storedValueName1": "Value" }, "customName": "optionalNameForRun" }' \
  https://api.testrigor.com/api/v1/apps/zikCmbLzeWkEez2bz/retest
      '''
    }
  }
}
  }
}
