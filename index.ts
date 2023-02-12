import { graphql } from "@octokit/graphql";
import * as dotenv from "dotenv";
import { Parser } from "json2csv";
const fs = require("fs");

dotenv.config();

const graphqlClient: typeof graphql = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
});

const OWNER = process.env.OWNER;

const searchQuery = (repo: string, endCursor?: string) => `
{
  search(type: ISSUE, query: "repo:${OWNER}/${repo} is:pr created:>=2022-04-01 base:develop", first: 100, ${
  endCursor ? `after: "${endCursor}"` : ""
}) {
    issueCount
    nodes {
      ...on PullRequest {
        title
        author {
          login
        }
        state
        number
        createdAt
        closed
        closedAt
        merged
        mergedAt
        milestone {
          title
        }
        repository {
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

`;

async function search(repo: string, endCursor?: string) {
  const result = [];
  try {
    let again = true;
    let endCursor;
    while (again) {
      const {
        search: { issueCount: issueCount, nodes: page, pageInfo: pageInfo },
      } = await graphqlClient(searchQuery(repo, endCursor));
      for (let item of page) {
        result.push({
          title: item.title,
          author: item.author?.login,
          state: item.state,
          number: item.number,
          createdAt: item.createdAt,
          closedAt: item.closedAt,
          merged: item.merged,
          milestone: item.milestone?.title ?? "",
          repository: item.repository?.name,
        });
      }
      again = pageInfo.hasNextPage;
      endCursor = pageInfo.endCursor;
    }
  } catch (e) {
    console.error(e.message);
  }
  // console.log(result);
  const parser = new Parser({
    fields: [
      "title",
      "author",
      "state",
      "number",
      "createdAt",
      "closedAt",
      "merged",
      "mergedAt",
      "milestone",
      "repository",
    ],
  });
  fs.writeFile(`/output/${repo}.csv`, parser.parse(result), (error, _data) => {
    if (error) console.log(error);
    else console.log("write end");
  });
}

const repositories = [
  // 好きなリポジトリ
];

for (let repo of repositories) {
  search(repo);
}
