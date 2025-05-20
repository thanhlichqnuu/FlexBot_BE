import axios from "axios";

const WIKI_SUMMARY_API = Bun.env.WIKI_SUMMARY_API
const WIKI_TITLE_API = Bun.env.WIKI_TITLE_API || ""

const fetchPersonName = async (personName: string) => {
  try {
    const params = {
      action: 'query',
      list: 'search',
      srsearch: personName,
      format: 'json',
      utf8: 1,
      origin: '*'
    }
    const {data} = await axios.get(WIKI_TITLE_API, {params});
    
    if (data.query?.search?.length > 0) {
      return data.query.search[0].title;
    }
  } catch (err) {
    return null;
  }
};

const fetchPersonSummary = async (title: string) => {
  try {
    const {data} = await axios.get(
      `${WIKI_SUMMARY_API}${encodeURIComponent(title)}`
    );
    return data.extract;
  } catch (err) {
    return null;
  }
};

const getPersonSummary = async (personName: string) => {
  try {
    const personTitle = await fetchPersonName(personName);
    if (!personTitle) {
      return null;
    }

    const personSummary = await fetchPersonSummary(personTitle);
    return personSummary;
  } catch (err) {
    return null;
  }
};

export default getPersonSummary;