import fs from 'fs';
import { createRequire } from 'module';
import { generateResumeFeedback } from '../services/aiService.js';
import { sendAnalysisEmail } from '../services/emailService.js';
import Candidate from '../models/Candidate.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No resume file uploaded'
            });
        }

        const { jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({
                error: 'Target job description is required'
            });
        }

        // Read and parse PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        const rawText = pdfData.text;

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Analyze resume using Gemini
        const aiAnalysis = await generateResumeFeedback(
            rawText,
            jobDescription
        );

        // Extract candidate email from resume
        const emailMatch = rawText.match(
            /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
        );

        const candidateEmail = emailMatch
            ? emailMatch[1]
            : `user-${Date.now()}@example.com`;

        // Save candidate to database
        const newCandidate = new Candidate({
            name: req.file.originalname.split('.')[0] || 'Unknown',
            email: candidateEmail,
            atsScore: aiAnalysis.matchScore || aiAnalysis.atsScore || 0,
            matchScore: aiAnalysis.matchScore || 0,
            skills: aiAnalysis.matchedSkills || [],
            matchedSkills: aiAnalysis.matchedSkills || [],
            missingSkills: aiAnalysis.missingSkills || [],
            suggestions: aiAnalysis.suggestions || [],
            jobDescription: jobDescription,
            status: 'Analyzed',
            resumeText: rawText
        });

        await newCandidate.save();

        // Send analysis result to your email
        await sendAnalysisEmail(aiAnalysis);

        // Send response to frontend
        res.json({
            success: true,
            data: {
                extractedTextSnippet:
                    rawText.substring(0, 150) + '...',
                analysis: aiAnalysis
            }
        });

    } catch (error) {
        console.error('Error analyzing resume:', error);

        res.status(500).json({
            error: 'Failed to analyze resume',
            details: error.message,
            stack: error.stack
        });
    }
};