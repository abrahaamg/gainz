-- ============================================================
-- 004_1rm_history.sql
-- Tabla para histórico de 1RM estimado y análisis de progreso
-- ============================================================

USE fitness_tracker;

CREATE TABLE IF NOT EXISTS exercise_1rm_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    exercise_id INT NOT NULL,
    estimated_1rm DECIMAL(6,2) NOT NULL,
    weight_used DECIMAL(6,2) NOT NULL,
    reps_done INT NOT NULL,
    session_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
