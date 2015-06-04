using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace DownloadAurelia
{
    class Program
    {
        static readonly string unZipFiles = Path.Combine(Environment.CurrentDirectory, "unzip");
        static readonly string unZipMasterFiles = Path.Combine(Environment.CurrentDirectory, "unzip-master");
        static readonly string zipFiles = Path.Combine(Environment.CurrentDirectory, "zips");
        static readonly string zipMasterFiles = Path.Combine(Environment.CurrentDirectory, "zips-master");
        static readonly string baseUrl = "https://github.com/aurelia";

        static readonly string[] repos = new[]{
            "binding",
            "bootstrapper",
            "dependency-injection",
            "event-aggregator",
            "framework",
            "history",
            "history-browser",
            "html-template-element",
            "http-client",
            "loader",
            "loader-default",
            "logging",
            "logging-console",
            "metadata",
            "path",
            "route-recognizer",
            "router",
            "task-queue",
            "templating",
            "templating-binding",
            "templating-resources",
            "templating-router",
            "validation"
        };

        static void DownloadZips()
        {
            DirectoryDelete(zipFiles);
            Directory.CreateDirectory(zipFiles);

            DirectoryDelete(zipMasterFiles);
            Directory.CreateDirectory(zipMasterFiles);

            var stamp = DateTime.Now.ToString("s");
            using (var w = new StreamWriter(Path.Combine(zipFiles, "versions.txt"), false))
            {
                w.WriteLine("/*");
                w.WriteLine(string.Format(" * Aurelia`s modules version at {0}", stamp));
                using (WebClient client = new WebClient())
                {
                    foreach (var repo in repos.OrderBy(s => s))
                    {
                        Console.Write(repo);
                        var blank = client.DownloadString(baseUrl + "/" + repo + "/tags");

                        //System.Text.RegularExpressions.
                        var regEx = new Regex("href=\"/aurelia/" + repo + "/archive/(\\d{1,2}\\.\\d{1,2}\\.\\d{1,2}).zip\"", RegexOptions.IgnoreCase);
                        var matches = regEx.Matches(blank);

                        var ver = matches.Cast<Match>().Select((item) =>
                        {
                            var version = item.Groups[1].Value.Split(new[] { '.' });
                            return int.Parse(version[0]) * 1000000 +
                                int.Parse(version[1]) * 1000 +
                                   int.Parse(version[2]);
                        }).Max();

                        var mod = ver % 1000000;
                        var i0 = (ver - mod) / 1000000;

                        ver = mod;
                        mod = ver % 1000;

                        var i1 = (ver - mod) / 1000;

                        var sVer = i0 + "." + i1 + "." + mod;

                        client.DownloadFile(baseUrl + "/" + repo + "/archive/" + sVer + ".zip", Path.Combine(zipFiles, repo + ".zip"));
                        client.DownloadFile(baseUrl + "/" + repo + "/archive/master.zip", Path.Combine(zipMasterFiles, repo + ".zip"));

                        w.WriteLine(" * " + repo + " : " + sVer);

                        Console.WriteLine(" - ok");
                    }
                    w.WriteLine(" */");
                    w.Flush();
                }
                File.WriteAllText(Path.Combine(zipMasterFiles, "versions.txt"), string.Format(@"// Aurelia`s modules latest version at {0}", stamp));
            }
        }

        static void Unzip()
        {
            DirectoryDelete(unZipFiles);
            Directory.CreateDirectory(unZipFiles);
            DirectoryDelete(unZipMasterFiles);
            Directory.CreateDirectory(unZipMasterFiles);

            foreach (var file in Directory.EnumerateFiles(zipFiles, "*.zip"))
            {
                Console.WriteLine(Path.GetFileNameWithoutExtension(file));
                using (ZipArchive archive = ZipFile.Open(file, ZipArchiveMode.Update))
                    archive.ExtractToDirectory(unZipFiles);
            }

            foreach (var file in Directory.EnumerateFiles(zipMasterFiles, "*.zip"))
            {
                Console.WriteLine(Path.GetFileNameWithoutExtension(file));
                using (ZipArchive archive = ZipFile.Open(file, ZipArchiveMode.Update))
                    archive.ExtractToDirectory(unZipMasterFiles);
            }
        }

        static void Rename()
        {
            foreach (var dir in Directory.EnumerateDirectories(unZipFiles))
            {
                var i = dir.LastIndexOf("-");
                Directory.Move(dir, dir.Substring(0, i));
            }
            foreach (var dir in Directory.EnumerateDirectories(unZipMasterFiles))
            {
                var i = dir.LastIndexOf("-");
                Directory.Move(dir, dir.Substring(0, i));
            }
            File.Copy(Path.Combine(zipFiles, "versions.txt"), Path.Combine(unZipFiles, "versions.txt"));
            File.Copy(Path.Combine(zipMasterFiles, "versions.txt"), Path.Combine(unZipMasterFiles, "versions.txt"));
        }

        static void Main(string[] args)
        {
            try
            {
                Console.WriteLine("downloading ...");
                DownloadZips();
                Console.WriteLine("unziping ...");
                Unzip();
                Console.WriteLine("renameing ...");
                Rename();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
            }
            Console.WriteLine("ok");
            //Console.WriteLine("Press any key to exit.");
            //Console.ReadKey();
        }

        static void DirectoryDelete(string name)
        {
            if (Directory.Exists(name))
            {
                Directory.Delete(name, true);
            }
        }
    }
}