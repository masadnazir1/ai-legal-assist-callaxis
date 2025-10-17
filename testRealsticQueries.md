test_queries = """
1. Summarize P L D 2010 Federal Shariat Court 1.
2. Give a summary of State vs Zia-ur-Rehman.
3. Explain the key findings in PLD 1972 SC 139 Asma Jilani case.
4. What was held in PLD 1958 SC 533 Dosso case?
5. Discuss the judgment of Benazir Bhutto vs Federation of Pakistan 1988.
6. Explain the principle laid down in PLD 1993 SC 473 Ahmed Tariq Rahim case.
7. What is the doctrine of necessity in Pakistani constitutional law?
8. How did the court interpret 'repugnancy to injunctions of Islam'?
9. Explain the concept of locus standi in Pakistani case law.
10. What are the principles of public interest litigation in Pakistan?
11. Discuss how Article 203-D powers were defined by the Federal Shariat Court.
12. How has the court defined rule of law in recent judgments?
13. Compare Asma Jilani case and Dosso case regarding martial law validity.
14. How have courts treated the doctrine of necessity before and after 2007?
15. Compare Benazir Bhutto (1988) and Shehla Zia (1994) cases on fundamental rights.
16. What is the difference between SCMR and PLD cases in terms of citation?
17. Compare rulings of Federal Shariat Court and Supreme Court on Islamic injunctions.
18. Explain Article 9 – Right to life with case references.
19. What is the interpretation of Article 25 (Equality) in Pakistani law?
20. Explain Article 203-D cases from Federal Shariat Court.
21. Summarize important judgments under Article 199.
22. How has Article 227 been applied in recent FSC cases?
23. What does Federal Shariat Court say about Pakistan Prisons Rules 1978?
24. Discuss judgments about repugnancy of laws to Quran and Sunnah.
25. Explain the meaning of 'Injunctions of Islam' as interpreted by the court.
26. What was the decision on interest (riba) cases by the Shariat Appellate Bench?
27. Summarize PLD 2000 FSC 1 about Zakat and Ushr laws.
28. Find cases reported in PLD 2010 Federal Shariat Court.
29. Show me latest SCMR 2020 decisions.
30. Get all YLR 2021 Lahore High Court cases.
31. List notable criminal law cases in 2023 SCMR.
32. Search for cases discussing fundamental rights.
33. Who were the judges in PLD 2010 Federal Shariat Court 1?
34. What was the background of the Asma Jilani case?
35. Give the main issue and outcome in State vs Zia-ur-Rehman.
36. Which case first declared martial law unconstitutional?
37. Provide short note on repugnancy test under Islamic law.
38. Give case law about women’s rights in Islam decided by FSC.
39. Summarize PLD 1994 SC 693 Shehla Zia vs WAPDA.
40. What did Supreme Court rule in 2023 SCMR 700 regarding corruption?
41. Explain constitutional interpretation by FSC in 2005.
42. What are landmark cases on Article 8 – Laws inconsistent with Fundamental Rights?
43. Compare judicial activism in 1990s vs 2020s.
44. Discuss cases where courts struck down discriminatory laws.
45. Explain public interest litigation trend post-2007.
46. How did the court handle blasphemy laws in recent cases?
47. What were the principles set out in Benazir Bhutto v Federation 1988 PLD?
48. What are examples of cases decided under Article 184(3)?
49. Explain how Pakistani courts view separation of powers doctrine.
50. How has Mens Rea been interpreted by Pakistani courts?
"""

# Save to text file
file_path = "/mnt/data/testRealsticQueries.txt"
with open(file_path, "w") as f:
    f.write(test_queries)

file_path
