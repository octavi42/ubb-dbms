import tkinter as tk
from tkinter import simpledialog, messagebox
import mysql.connector

# Existing functions you've defined
config = {
  'user': 'root',
  'password': 'Bebxar-jehreh-6recro',
  'host': '127.0.0.1',
  'database': 'guide_app',
  'raise_on_warnings': True
}

def create_connection():
    return mysql.connector.connect(**config)

def create_record(name, age, language):
    cnx = create_connection()
    if cnx.is_connected():
        with cnx.cursor() as cursor:
            query = "INSERT INTO guide (name, age, language) VALUES (%s, %s, %s)"
            cursor.execute(query, (name, age, language))
            cnx.commit()
            record_id = cursor.lastrowid
        cnx.close()
        return f"Record created successfully with ID: {record_id}"
    else:
        return "Could not connect"

def read_records():
    cnx = create_connection()
    results = []
    if cnx.is_connected():
        with cnx.cursor() as cursor:
            cursor.execute("SELECT * FROM guide")
            results = cursor.fetchall()
        cnx.close()
    return results

def update_record(id, new_name):
    cnx = create_connection()
    if cnx.is_connected():
        with cnx.cursor() as cursor:
            query = "UPDATE guide SET name = %s WHERE id = %s"
            cursor.execute(query, (new_name, id))
            cnx.commit()
        cnx.close()
        return "Record updated successfully"
    else:
        return "Could not connect"

def delete_record(id):
    cnx = create_connection()
    if cnx.is_connected():
        with cnx.cursor() as cursor:
            query = "DELETE FROM guide WHERE id = %s"
            cursor.execute(query, (id,))
            cnx.commit()
        cnx.close()
        return "Record deleted successfully"
    else:
        return "Could not connect"

# GUI
class DatabaseApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Database GUI')
        self.geometry('400x300')

        # Create UI elements
        tk.Button(self, text="Create Record", command=self.create_record).pack(fill=tk.X)
        tk.Button(self, text="Display Records", command=self.display_records).pack(fill=tk.X)
        tk.Button(self, text="Update Record", command=self.update_record).pack(fill=tk.X)
        tk.Button(self, text="Delete Record", command=self.delete_record).pack(fill=tk.X)

    def create_record(self):
        name = simpledialog.askstring("Input", "Enter name", parent=self)
        age = simpledialog.askstring("Input", "Enter age", parent=self)
        language = simpledialog.askstring("Input", "Enter language", parent=self)
        if name and age and language:
            message = create_record(name, int(age), language)
            messagebox.showinfo("Create Record", message)

    def display_records(self):
        records = read_records()
        display_text = "\n".join([f"ID: {record[0]}, Name: {record[1]}, Age: {record[2]}, Language: {record[3]}" for record in records])
        messagebox.showinfo("Records", display_text if records else "No records found")

    def update_record(self):
        id = simpledialog.askstring("Input", "Enter record ID", parent=self)
        new_name = simpledialog.askstring("Input", "Enter new name", parent=self)
        if id and new_name:
            message = update_record(int(id), new_name)
            messagebox.showinfo("Update Record", message)

    def delete_record(self):
        id = simpledialog.askstring("Input", "Enter record ID to delete", parent=self)
        if id:
            message = delete_record(int(id))
            messagebox.showinfo("Delete Record", message)

if __name__ == "__main__":
    app = DatabaseApp()
    app.mainloop()
