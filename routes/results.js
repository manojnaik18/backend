const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Result = require('../models/Result');

// POST /api/results
router.post('/results', async (req, res) => {
    try {
        const { studentName, subjectName, score, className } = req.body;

        // Server-side validation for the score
        if (score < 0 || score > 100) {
            return res.status(400).json({ error: 'Score must be between 0 and 100.' });
        }

        let student = await Student.findOne({ name: studentName, className: className });
        if (!student) student = await Student.create({ name: studentName, className: className });

        let subject = await Subject.findOne({ name: subjectName });
        if (!subject) subject = await Subject.create({ name: subjectName, className: className });

        const result = await Result.create({ student: student._id, subject: subject._id, score });
        res.json({ message: 'Result added successfully', result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/subjects - To populate dropdowns
router.get('/subjects', async (req, res) => {
    try {
        // Find all subjects and sort them alphabetically
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/students - To get a list of all students
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/results/all - To get a list of all results
router.get('/results/all', async (req, res) => {
    try {
        // Populate student and subject details, and sort by most recent entry
        const results = await Result.find().populate('student').populate('subject').sort({ _id: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard-summary
router.get('/dashboard-summary', async (req, res) => {
    try {
        const results = await Result.find().populate('student').populate('subject');

        const studentMap = {};
        const subjectMap = {};
        const scoreDistribution = { '>90':0, '80-89':0, '70-79':0, '60-69':0, '50-59':0, '<50':0 };

        results.forEach(r => {
            // If a student or subject has been deleted, the populated field will be null.
            // Skip these results to avoid errors.
            if (!r.student || !r.subject) return;
            const studentName = r.student.name;
            const subjectName = r.subject.name;

            if (!studentMap[studentName]) studentMap[studentName] = [];
            studentMap[studentName].push(r.score);

            if (!subjectMap[subjectName]) subjectMap[subjectName] = [];
            subjectMap[subjectName].push(r.score);
        });

        const overallScores = Object.values(studentMap).flat();
        const overallClassAverage = overallScores.reduce((a,b)=>a+b,0)/overallScores.length || 0;

        const avgPerSubject = {};
        Object.keys(subjectMap).forEach(sub => {
            const scores = subjectMap[sub];
            avgPerSubject[sub] = scores.reduce((a,b)=>a+b,0)/scores.length;
        });

        const studentAverages = Object.entries(studentMap).map(([name,scores])=>({
            name,
            avg: scores.reduce((a,b)=>a+b,0)/scores.length
        }));

        const top3Students = studentAverages.sort((a,b)=>b.avg-a.avg).slice(0,3);
        const needingAttention = studentAverages.filter(s=>s.avg<50).map(s=>s.name);

        studentAverages.forEach(s=>{
            if(s.avg>90) scoreDistribution['>90']++;
            else if(s.avg>=80) scoreDistribution['80-89']++;
            else if(s.avg>=70) scoreDistribution['70-79']++;
            else if(s.avg>=60) scoreDistribution['60-69']++;
            else if(s.avg>=50) scoreDistribution['50-59']++;
            else scoreDistribution['<50']++;
        });

        res.json({
            overallClassAverage,
            avgPerSubject,
            top3Students,
            needingAttention,
            scoreDistribution
        });
    } catch (err) {
        console.log("erorrrrrrrrrrrrrr",err);
        
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
