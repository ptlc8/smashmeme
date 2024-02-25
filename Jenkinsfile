pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Restart') {
            steps {
                sh 'npm run restart'
            }
        }
    }
}