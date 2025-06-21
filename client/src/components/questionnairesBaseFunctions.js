import axios from "axios";

export async function fetchInfo() {
    try {
    const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/user-info`, {
        withCredentials: true,
    });

    if (response.status === 200) {
        return { success: true, data: response.data };
    } else {
        return { success: false, error: new Error(`Server responded with status: ${response.status}`), response };    
    }

    } catch (error) {
        return { success: false, error: error };
    }
};


export async function restoreSurveyData(certification_id) {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses-fetch`, {
        withCredentials: true,
        params: {
          certification_id: certification_id
        }
      });


    if (response.data) {
        const surveyData = typeof response.data.survey_data === 'string'
          ? JSON.parse(response.data.survey_data)
          : response.data.survey_data;

        return { success: true, surveyData, pageNo: response.data.pageNo, completed: response.data.completed, previousCO2emissions: response.data.co2emissions, previousScore: response.data.total_score };
      }
    } catch (error) {
      return { success: false, error: error };
    }
};

export async function submitSurveyData(data) {
    try {
        const response = await axios.post(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/responses`, data, {
            withCredentials: true,
        });
        if (response.status === 200) {
            console.log("200")
            return { success: true, msg: "Survey data saved successfully" };
        } else {
            console.log("not 200")
            return { success: false, error: new Error(`Server responded with status: ${response.status}`), response };
        }
    } catch (error) {
        console.log(error)
        return { success: false, error: error };
    }
}