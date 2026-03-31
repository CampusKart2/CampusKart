pipeline {
  agent any
  stages {
    stage('Hello') {
      steps {
        echo "Branch: ${env.BRANCH_NAME}"
        sh 'whoami'
      }
    }
  }
}