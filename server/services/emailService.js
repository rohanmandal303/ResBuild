import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const sendAnalysisEmail = async (analysis) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'rohanmandal414@gmail.com',
        subject: 'AI Resume Analyzer - Resume Analysis',
        html: `
            <h2>Resume Analysis Result</h2>

            <p><strong>Match Score:</strong> ${
                analysis.matchScore || analysis.atsScore || 0
            }%</p>

            <h3>Matched Skills</h3>
            <p>${(analysis.matchedSkills || []).join(', ') || 'None'}</p>

            <h3>Missing Skills</h3>
            <p>${(analysis.missingSkills || []).join(', ') || 'None'}</p>

            <h3>Suggestions</h3>
            <ul>
                ${(analysis.suggestions || [])
                    .map(item => `<li>${item}</li>`)
                    .join('')}
            </ul>
        `,
    });
};