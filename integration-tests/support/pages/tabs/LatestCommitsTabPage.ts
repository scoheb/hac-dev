import { Common } from "../../../utils/Common";

type CommitObject = {
  sha: string,
  title: string,
  user: string,
  message: string,
}

// Latest Commits List view page
export class LatestCommitsTabPage {
  public commitList: Array<CommitObject> = [];
  public token: string = Cypress.env('GH_TOKEN');
  public owner: string;
  public repoName: string;

  fetchCommitSHAOnPR(componentName: string, publicGitRepo: string) {
    this.owner = publicGitRepo.split("/")[3];
    this.repoName = publicGitRepo.split("/")[4];

    Common.getPRNumber(componentName, publicGitRepo);
    cy.get('@pullNumber').then((pullNumber) => {
      cy.log(String(pullNumber));

      cy.exec(`curl \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${this.token}"\
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/${this.owner}/${this.repoName}/pulls/${pullNumber}/commits`).then((result) => {
        if (result.code) {
          throw new Error(`Execution failed \n
          Exit code: ${result.code}
          Stdout:\n${result.stdout}
          Stderr:\n${result.stderr}`);
        }

        const commitsArray = JSON.parse(result.stdout);

        for (let i = 0; i < commitsArray.length; i++) {
          let commitObject: CommitObject = {
            sha: commitsArray[i]["sha"],
            title: `#${pullNumber} Appstudio update ${componentName}`,
            user: "appstudio-staging-ci__bot",
            message: ""
          };

          this.commitList.push(commitObject);
        }
      });
    });
  }

  mergePR(componentName: string, publicGitRepo: string) {
    this.owner = publicGitRepo.split("/")[3];
    this.repoName = publicGitRepo.split("/")[4];
    const commitTitle = "Merging a PR by Stonesoup";
    const commitMessage = "This PR was auto-generated by appstudio-staging-ci__bot";

    Common.getPRNumber(componentName, publicGitRepo);
    cy.get('@pullNumber').then((pullNumber) => {
      cy.log(String(pullNumber));

      cy.exec(`curl \
      -X PUT \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${this.token}"\
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/${this.owner}/${this.repoName}/pulls/${pullNumber}/merge \
      -d '{"commit_title":"${commitTitle}","commit_message":"${commitMessage}"}'`).then((result) => {
        if (result.code) {
          throw new Error(`Execution failed \n
          Exit code: ${result.code}
          Stdout:\n${result.stdout}
          Stderr:\n${result.stderr}`);
        }

        const obj = JSON.parse(result.stdout);

        let commitObject: CommitObject = {
          sha: obj["sha"],
          title: commitTitle,
          user: Cypress.env("GH_USERNAME"),
          message: commitMessage
        };

        this.commitList.push(commitObject);
      });
    });
  }

  editFile(publicGitRepo: string, filePath: string, commitMessage: string, updatedFileContentInBase64: string, fileSHA: string) {
    this.owner = publicGitRepo.split("/")[3];
    this.repoName = publicGitRepo.split("/")[4];

    cy.exec(`curl \
    -X PUT \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${this.token}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    https://api.github.com/repos/${this.owner}/${this.repoName}/contents/${filePath} \
    -d '{"message":"${commitMessage}","content":"${updatedFileContentInBase64}","sha":"${fileSHA}"}'`).then((result) => {
      if (result.code) {
        throw new Error(`Execution failed \n
          Exit code: ${result.code}
          Stdout:\n${result.stdout}
          Stderr:\n${result.stderr}`);
      }

      const obj = JSON.parse(result.stdout);

      let commitObject: CommitObject = {
        sha: obj["commit"]["sha"],
        title: commitMessage,
        user: Cypress.env("GH_USERNAME"),
        message: ""
      };

      this.commitList.push(commitObject);
    });
  }
}
